import { OrderForm } from './order-form';
import { AVAILABLE_ORDER_ITEMS } from '../config/order-item-options';
import { useOrderForm } from '../hooks/use-order-form';

export function OrderPage() {
  const {
    addItem,
    customerEmail,
    customerName,
    fieldErrors,
    isSubmitting,
    items,
    removeItem,
    setCustomerEmail,
    setCustomerName,
    setItemId,
    setItemQuantity,
    submission,
    submit,
  } = useOrderForm();

  return (
    <main className="page-shell">
      <section className="page-grid">
        <OrderForm
          customerEmail={customerEmail}
          customerName={customerName}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          items={items}
          itemOptions={AVAILABLE_ORDER_ITEMS}
          onAddItem={addItem}
          onCustomerEmailChange={setCustomerEmail}
          onCustomerNameChange={setCustomerName}
          onItemIdChange={setItemId}
          onItemQuantityChange={setItemQuantity}
          onRemoveItem={removeItem}
          onSubmit={submit}
          submission={submission}
        />

        <aside className="split-pane split-pane-light catalog-pane">
          <p className="eyebrow">Catalog</p>
          <h2>Available mock items</h2>
          <p className="panel-description">
            The backend uses a hard-coded price catalog. These values are shown
            here so the UI is demoable without an additional lookup endpoint.
          </p>

          <ul className="catalog-list">
            {AVAILABLE_ORDER_ITEMS.map((item) => (
              <li className="catalog-card" key={item.id}>
                <div>
                  <p className="catalog-card-title">{item.label}</p>
                  <p className="catalog-card-meta">{item.id}</p>
                </div>
                <strong>{formatPrice(item.unitPriceCents)}</strong>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}

function formatPrice(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(amountInCents / 100);
}
