import type { OrderItemOption } from '../config/order-item-options';
import type { OrderItemDraft } from '../hooks/use-order-form';

interface OrderItemRowProps {
  readonly canRemove: boolean;
  readonly errorId: string | undefined;
  readonly errorQuantity: string | undefined;
  readonly index: number;
  readonly isSubmitting: boolean;
  readonly item: OrderItemDraft;
  readonly itemOptions: readonly OrderItemOption[];
  readonly onIdChange: (itemKey: string, value: string) => void;
  readonly onQuantityChange: (itemKey: string, value: string) => void;
  readonly onRemove: (itemKey: string) => void;
}

export function OrderItemRow({
  canRemove,
  errorId,
  errorQuantity,
  index,
  isSubmitting,
  item,
  itemOptions,
  onIdChange,
  onQuantityChange,
  onRemove,
}: OrderItemRowProps) {
  const selectedItem = itemOptions.find((option) => option.id === item.id) ?? {
    id: item.id,
    label: item.id,
    unitPriceCents: 0,
  };

  return (
    <article className="item-row">
      <div className="item-row-header">
        <div>
          <p className="item-row-label">Line item {index + 1}</p>
          <p className="item-row-meta">
            {selectedItem.label} | {formatPrice(selectedItem.unitPriceCents)}
          </p>
        </div>
        <button
          className="ghost-button"
          disabled={isSubmitting || !canRemove}
          onClick={() => onRemove(item.key)}
          type="button"
        >
          Remove
        </button>
      </div>

      <div className="item-row-grid">
        <label className="field">
          <span>Item</span>
          <select
            onChange={(event) => onIdChange(item.key, event.target.value)}
            value={item.id}
          >
            {itemOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} ({option.id})
              </option>
            ))}
          </select>
          <FieldError message={errorId} />
        </label>

        <label className="field">
          <span>Quantity</span>
          <input
            inputMode="numeric"
            min="1"
            onChange={(event) => onQuantityChange(item.key, event.target.value)}
            step="1"
            type="number"
            value={item.quantity}
          />
          <FieldError message={errorQuantity} />
        </label>
      </div>
    </article>
  );
}

function FieldError({ message }: { readonly message: string | undefined }) {
  if (message === undefined) {
    return null;
  }

  return <span className="field-error">{message}</span>;
}

function formatPrice(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(amountInCents / 100);
}
