import type { FormEvent } from 'react';

import type { OrderItemOption } from '../config/order-item-options';
import type {
  OrderFormFieldErrors,
  OrderFormSubmissionState,
  OrderItemDraft,
} from '../hooks/use-order-form';
import { VirtualizedList } from '../../../shared/components/virtualized-list';
import { OrderItemRow } from './order-item-row';
import { OrderResultPanel } from './order-result-panel';

interface OrderFormProps {
  readonly customerEmail: string;
  readonly customerName: string;
  readonly fieldErrors: OrderFormFieldErrors;
  readonly isSubmitting: boolean;
  readonly items: readonly OrderItemDraft[];
  readonly itemOptions: readonly OrderItemOption[];
  readonly onAddItem: () => void;
  readonly onCustomerEmailChange: (value: string) => void;
  readonly onCustomerNameChange: (value: string) => void;
  readonly onItemIdChange: (itemKey: string, value: string) => void;
  readonly onItemQuantityChange: (itemKey: string, value: string) => void;
  readonly onRemoveItem: (itemKey: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly submission: OrderFormSubmissionState;
}

export function OrderForm({
  customerEmail,
  customerName,
  fieldErrors,
  isSubmitting,
  items,
  itemOptions,
  onAddItem,
  onCustomerEmailChange,
  onCustomerNameChange,
  onItemIdChange,
  onItemQuantityChange,
  onRemoveItem,
  onSubmit,
  submission,
}: OrderFormProps) {
  return (
    <section className="split-pane split-pane-dark order-pane">
      <div className="panel-copy">
        <p className="eyebrow">Order Builder</p>
        <h1>Submit a customer order in one pass.</h1>
        <p className="panel-description">
          Enter the customer details, build the line items, and submit the order
          to the backend API. Rejections are still valid responses and will be
          shown inline.
        </p>
      </div>

      <form className="order-form" noValidate onSubmit={onSubmit}>
        <fieldset className="form-grid" disabled={isSubmitting}>
          <label className="field">
            <span>Name</span>
            <input
              autoComplete="name"
              name="customerName"
              onChange={(event) => onCustomerNameChange(event.target.value)}
              placeholder="Jane Doe"
              type="text"
              value={customerName}
            />
            <FieldError message={fieldErrors['customer.name']} />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="customerEmail"
              onChange={(event) => onCustomerEmailChange(event.target.value)}
              placeholder="jane@example.com"
              type="email"
              value={customerEmail}
            />
            <FieldError message={fieldErrors['customer.email']} />
          </label>
        </fieldset>

        <section className="line-items">
          <div className="section-header">
            <div>
              <h2>Items</h2>
              <p>Add one or more items with quantities.</p>
            </div>
            <button
              className="secondary-button"
              disabled={isSubmitting}
              onClick={onAddItem}
              type="button"
            >
              Add item
            </button>
          </div>

          <VirtualizedList
            className="items-stack"
            estimateItemHeight={168}
            gap={14}
            getItemKey={(item) => item.key}
            items={items}
            overscan={4}
            renderItem={(item, index) => (
              <OrderItemRow
                canRemove={items.length > 1}
                errorId={fieldErrors[`items[${index}].id`]}
                errorQuantity={fieldErrors[`items[${index}].quantity`]}
                index={index}
                isSubmitting={isSubmitting}
                item={item}
                itemOptions={itemOptions}
                key={item.key}
                onIdChange={onItemIdChange}
                onQuantityChange={onItemQuantityChange}
                onRemove={onRemoveItem}
              />
            )}
            virtualizedClassName="items-stack items-stack-virtualized"
            virtualizationThreshold={7}
          />
          <FieldError message={fieldErrors.items} />
        </section>

        <div className="form-actions">
          <button
            className="primary-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Submitting order...' : 'Submit order'}
          </button>
          <p className="helper-text">
            Orders over the configured threshold will return a rejected status.
          </p>
        </div>
      </form>

      <OrderResultPanel submission={submission} />
    </section>
  );
}

function FieldError({ message }: { readonly message: string | undefined }) {
  if (message === undefined) {
    return null;
  }

  return <span className="field-error">{message}</span>;
}
