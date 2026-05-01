import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrderPage } from '../../../src/features/orders/components/order-page';

describe('OrderPage', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  it('shows local validation errors before calling the API', async () => {
    const user = userEvent.setup();

    render(<OrderPage />);

    await user.click(
      screen.getByRole('button', {
        name: 'Submit order',
      }),
    );

    expect(screen.getByText('Customer name is required.')).toBeInTheDocument();
    expect(screen.getByText('Customer email is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits the order and renders a confirmed result', async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      createJsonResponse({
        body: {
          orderId: '018f2f8d-d3d2-7b35-9f64-6e4c2e3f7a10',
          status: 'CONFIRMED',
          total: 3000,
        },
        status: 200,
      }),
    );

    render(<OrderPage />);

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.clear(screen.getByLabelText('Quantity'));
    await user.type(screen.getByLabelText('Quantity'), '2');
    await user.click(
      screen.getByRole('button', {
        name: 'Submit order',
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/orders',
      expect.objectContaining({
        body: JSON.stringify({
          customer: {
            email: 'jane@example.com',
            name: 'Jane Doe',
          },
          items: [
            {
              id: 'item_1',
              quantity: 2,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Order confirmed',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
  });

  it('renders a rejected result when the backend rejects the order', async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      createJsonResponse({
        body: {
          orderId: '018f2f8d-d3d2-7b35-9f64-6e4c2e3f7a10',
          reason: 'ORDER_TOTAL_TOO_HIGH',
          status: 'REJECTED',
        },
        status: 200,
      }),
    );

    render(<OrderPage />);

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.selectOptions(screen.getByLabelText('Item'), 'item_4');
    await user.clear(screen.getByLabelText('Quantity'));
    await user.type(screen.getByLabelText('Quantity'), '3');
    await user.click(
      screen.getByRole('button', {
        name: 'Submit order',
      }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Order rejected',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('ORDER_TOTAL_TOO_HIGH')).toBeInTheDocument();
  });

  it('surfaces structured API errors in the UI', async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      createJsonResponse({
        body: {
          error: {
            code: 'UNKNOWN_ORDER_ITEM',
            details: [
              {
                message: 'Unknown item id "missing_item".',
                path: 'items',
              },
            ],
            message: 'One or more submitted items are not supported.',
          },
          requestId: 'req-123',
        },
        status: 400,
      }),
    );

    render(<OrderPage />);

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.click(
      screen.getByRole('button', {
        name: 'Submit order',
      }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Submission failed',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('One or more submitted items are not supported.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Unknown item id "missing_item".')).toHaveLength(
      2,
    );
  });
});

function createJsonResponse(input: {
  readonly body: unknown;
  readonly status: number;
}): Response {
  return {
    ok: input.status >= 200 && input.status < 300,
    status: input.status,
    text: () => Promise.resolve(JSON.stringify(input.body)),
  } as Response;
}
