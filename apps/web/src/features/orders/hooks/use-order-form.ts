import { useEffect, useReducer, useRef } from 'react';
import type { FormEvent } from 'react';
import type { ZodError } from 'zod';

import { OrderSubmissionApiError, submitOrder } from '../api/order-api';
import {
  submitOrderFormSchema,
  type ApiErrorDetail,
} from '../contracts/order-client-contract';

export interface OrderItemDraft {
  readonly id: string;
  readonly key: string;
  readonly quantity: string;
}

export type OrderFormFieldErrors = Record<string, string>;

export type OrderFormSubmissionState =
  | {
      readonly status: 'idle';
    }
  | {
      readonly status: 'submitting';
    }
  | {
      readonly details: readonly ApiErrorDetail[];
      readonly message: string;
      readonly status: 'error';
    }
  | {
      readonly result:
        | {
            readonly orderId: string;
            readonly status: 'CONFIRMED';
            readonly total: number;
          }
        | {
            readonly orderId: string;
            readonly reason: 'ORDER_TOTAL_TOO_HIGH';
            readonly status: 'REJECTED';
          };
      readonly status: 'success';
    };

interface OrderFormState {
  readonly customerEmail: string;
  readonly customerName: string;
  readonly fieldErrors: OrderFormFieldErrors;
  readonly items: readonly OrderItemDraft[];
  readonly submission: OrderFormSubmissionState;
}

type OrderFormAction =
  | {
      readonly field: 'customerEmail' | 'customerName';
      readonly type: 'customer.updated';
      readonly value: string;
    }
  | {
      readonly item: OrderItemDraft;
      readonly type: 'item.added';
    }
  | {
      readonly itemKey: string;
      readonly type: 'item.removed';
    }
  | {
      readonly field: 'id' | 'quantity';
      readonly itemKey: string;
      readonly type: 'item.updated';
      readonly value: string;
    }
  | {
      readonly type: 'submission.started';
    }
  | {
      readonly result: Extract<
        OrderFormSubmissionState,
        { status: 'success' }
      >['result'];
      readonly type: 'submission.succeeded';
    }
  | {
      readonly details: Extract<
        OrderFormSubmissionState,
        { status: 'error' }
      >['details'];
      readonly message: string;
      readonly type: 'submission.failed';
    }
  | {
      readonly errors: OrderFormFieldErrors;
      readonly type: 'validation.failed';
    };

const INITIAL_ITEM: OrderItemDraft = {
  id: 'item_1',
  key: 'item-1',
  quantity: '1',
};

const INITIAL_STATE: OrderFormState = {
  customerEmail: '',
  customerName: '',
  fieldErrors: {},
  items: [INITIAL_ITEM],
  submission: {
    status: 'idle',
  },
};

export function useOrderForm() {
  const [state, dispatch] = useReducer(orderFormReducer, INITIAL_STATE);
  const nextItemNumberRef = useRef(2);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPayload = submitOrderFormSchema.safeParse({
      customer: {
        email: state.customerEmail,
        name: state.customerName,
      },
      items: state.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    });

    if (!parsedPayload.success) {
      dispatch({
        errors: mapZodErrors(parsedPayload.error),
        type: 'validation.failed',
      });
      return;
    }

    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    dispatch({
      type: 'submission.started',
    });

    try {
      const result = await submitOrder(
        parsedPayload.data,
        abortController.signal,
      );

      dispatch({
        result,
        type: 'submission.succeeded',
      });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      if (error instanceof OrderSubmissionApiError) {
        dispatch({
          details: error.details,
          message: error.message,
          type: 'submission.failed',
        });
        return;
      }

      dispatch({
        details: [],
        message:
          'The order could not be submitted. Confirm the API is running and try again.',
        type: 'submission.failed',
      });
    }
  }

  return {
    addItem: () => {
      const nextItemKey = `item-${nextItemNumberRef.current}`;
      nextItemNumberRef.current += 1;

      dispatch({
        item: {
          id: 'item_1',
          key: nextItemKey,
          quantity: '1',
        },
        type: 'item.added',
      });
    },
    customerEmail: state.customerEmail,
    customerName: state.customerName,
    fieldErrors: state.fieldErrors,
    isSubmitting: state.submission.status === 'submitting',
    items: state.items,
    removeItem: (itemKey: string) => {
      dispatch({
        itemKey,
        type: 'item.removed',
      });
    },
    setCustomerEmail: (value: string) => {
      dispatch({
        field: 'customerEmail',
        type: 'customer.updated',
        value,
      });
    },
    setCustomerName: (value: string) => {
      dispatch({
        field: 'customerName',
        type: 'customer.updated',
        value,
      });
    },
    setItemId: (itemKey: string, value: string) => {
      dispatch({
        field: 'id',
        itemKey,
        type: 'item.updated',
        value,
      });
    },
    setItemQuantity: (itemKey: string, value: string) => {
      dispatch({
        field: 'quantity',
        itemKey,
        type: 'item.updated',
        value,
      });
    },
    submission: state.submission,
    submit,
  };
}

function orderFormReducer(
  state: OrderFormState,
  action: OrderFormAction,
): OrderFormState {
  switch (action.type) {
    case 'customer.updated':
      return {
        ...state,
        [action.field]: action.value,
        fieldErrors: clearFieldErrors(state.fieldErrors, [
          action.field === 'customerName' ? 'customer.name' : 'customer.email',
        ]),
        submission: {
          status: 'idle',
        },
      };
    case 'item.added':
      return {
        ...state,
        fieldErrors: {},
        items: [...state.items, action.item],
        submission: {
          status: 'idle',
        },
      };
    case 'item.removed':
      return {
        ...state,
        fieldErrors: {},
        items:
          state.items.length === 1
            ? state.items
            : state.items.filter((item) => item.key !== action.itemKey),
        submission: {
          status: 'idle',
        },
      };
    case 'item.updated':
      return {
        ...state,
        fieldErrors: {},
        items: state.items.map((item) =>
          item.key === action.itemKey
            ? {
                ...item,
                [action.field]: action.value,
              }
            : item,
        ),
        submission: {
          status: 'idle',
        },
      };
    case 'submission.started':
      return {
        ...state,
        fieldErrors: {},
        submission: {
          status: 'submitting',
        },
      };
    case 'submission.succeeded':
      return {
        ...state,
        fieldErrors: {},
        submission: {
          result: action.result,
          status: 'success',
        },
      };
    case 'submission.failed':
      return {
        ...state,
        fieldErrors: mapApiDetailsToFieldErrors(action.details),
        submission: {
          details: action.details,
          message: action.message,
          status: 'error',
        },
      };
    case 'validation.failed':
      return {
        ...state,
        fieldErrors: action.errors,
        submission: {
          status: 'idle',
        },
      };
    default:
      return state;
  }
}

function mapZodErrors(error: ZodError): OrderFormFieldErrors {
  return error.issues.reduce<OrderFormFieldErrors>((errors, issue) => {
    const path = formatIssuePath(issue.path);

    if (path !== undefined && errors[path] === undefined) {
      errors[path] = issue.message;
    }

    return errors;
  }, {});
}

function formatIssuePath(
  path: readonly (string | number)[],
): string | undefined {
  if (path.length === 0) {
    return undefined;
  }

  return path.reduce<string>((formattedPath, segment) => {
    if (typeof segment === 'number') {
      return `${formattedPath}[${segment}]`;
    }

    return formattedPath.length === 0 ? segment : `${formattedPath}.${segment}`;
  }, '');
}

function clearFieldErrors(
  fieldErrors: OrderFormFieldErrors,
  fields: readonly string[],
): OrderFormFieldErrors {
  return Object.entries(fieldErrors).reduce<OrderFormFieldErrors>(
    (nextErrors, [field, message]) => {
      if (!fields.includes(field)) {
        nextErrors[field] = message;
      }

      return nextErrors;
    },
    {},
  );
}

function mapApiDetailsToFieldErrors(
  details: readonly ApiErrorDetail[],
): OrderFormFieldErrors {
  return details.reduce<OrderFormFieldErrors>((errors, detail) => {
    if (detail.path !== undefined && errors[detail.path] === undefined) {
      errors[detail.path] = detail.message;
    }

    return errors;
  }, {});
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
