import type { OrderFormSubmissionState } from '../hooks/use-order-form';

interface OrderResultPanelProps {
  readonly submission: OrderFormSubmissionState;
}

export function OrderResultPanel({ submission }: OrderResultPanelProps) {
  if (submission.status === 'idle') {
    return (
      <section className="result-panel result-panel-idle">
        <p className="eyebrow">Status</p>
        <h2>Ready to submit</h2>
        <p className="panel-description">
          Submit the form to see a confirmed or rejected order response from the
          API.
        </p>
      </section>
    );
  }

  if (submission.status === 'submitting') {
    return (
      <section className="result-panel result-panel-pending">
        <p className="eyebrow">Status</p>
        <h2>Submitting order</h2>
        <p className="panel-description">
          Waiting for the backend to validate, price, and process the order.
        </p>
      </section>
    );
  }

  if (submission.status === 'error') {
    return (
      <section className="result-panel result-panel-error">
        <p className="eyebrow">Status</p>
        <h2>Submission failed</h2>
        <p className="panel-description">{submission.message}</p>
        {submission.details.length > 0 ? (
          <ul className="error-list">
            {submission.details.map((detail) => (
              <li key={`${detail.path ?? 'general'}-${detail.message}`}>
                {detail.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  if (submission.result.status === 'CONFIRMED') {
    return (
      <section className="result-panel result-panel-success">
        <p className="eyebrow">Status</p>
        <h2>Order confirmed</h2>
        <dl className="result-list">
          <div>
            <dt>Order ID</dt>
            <dd>{submission.result.orderId}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatPrice(submission.result.total)}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="result-panel result-panel-rejected">
      <p className="eyebrow">Status</p>
      <h2>Order rejected</h2>
      <dl className="result-list">
        <div>
          <dt>Order ID</dt>
          <dd>{submission.result.orderId}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{submission.result.reason}</dd>
        </div>
      </dl>
    </section>
  );
}

function formatPrice(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(amountInCents / 100);
}
