import { env } from '../../../config/env';
import {
  apiErrorResponseSchema,
  submitOrderResponseSchema,
  type ApiErrorDetail,
  type SubmitOrderPayload,
  type SubmitOrderResponse,
} from '../contracts/order-client-contract';

export class OrderSubmissionApiError extends Error {
  public readonly code: string;
  public readonly details: readonly ApiErrorDetail[];
  public readonly requestId: string | undefined;
  public readonly statusCode: number;

  public constructor(input: {
    readonly code: string;
    readonly details?: readonly ApiErrorDetail[];
    readonly message: string;
    readonly requestId?: string;
    readonly statusCode: number;
  }) {
    super(input.message);
    this.code = input.code;
    this.details = input.details ?? [];
    this.name = 'OrderSubmissionApiError';
    this.requestId = input.requestId;
    this.statusCode = input.statusCode;
  }
}

export async function submitOrder(
  payload: SubmitOrderPayload,
  signal?: AbortSignal,
): Promise<SubmitOrderResponse> {
  const response = await fetch(`${env.VITE_API_BASE_URL}/orders`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    ...(signal === undefined ? {} : { signal }),
  });
  const json = await parseJson(response);

  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(json);

    if (parsedError.success) {
      throw new OrderSubmissionApiError({
        code: parsedError.data.error.code,
        details: parsedError.data.error.details,
        message: parsedError.data.error.message,
        requestId: parsedError.data.requestId,
        statusCode: response.status,
      });
    }

    throw new OrderSubmissionApiError({
      code: 'UNEXPECTED_API_RESPONSE',
      message: 'The API returned an unexpected error response.',
      statusCode: response.status,
    });
  }

  const parsedResponse = submitOrderResponseSchema.safeParse(json);

  if (!parsedResponse.success) {
    throw new OrderSubmissionApiError({
      code: 'UNEXPECTED_API_RESPONSE',
      details: [
        {
          message: 'The API returned an invalid success payload.',
        },
      ],
      message: 'The API returned an unexpected success response.',
      statusCode: response.status,
    });
  }

  return parsedResponse.data;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new OrderSubmissionApiError({
      code: 'INVALID_JSON_RESPONSE',
      message: 'The API returned a malformed JSON response.',
      statusCode: response.status,
    });
  }
}
