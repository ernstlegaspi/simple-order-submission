import { describe, expect, it } from 'vitest';

import { SubmitOrderService } from '../../../src/orders/application/submit-order-service.js';
import { UnknownOrderItemsError } from '../../../src/orders/domain/errors.js';
import { ThresholdOrderDecisionPolicy } from '../../../src/orders/domain/order-decision-policy.js';
import { ORDER_STATUS } from '../../../src/orders/domain/order.js';
import { InMemoryOrderRepository } from '../../../src/orders/infrastructure/in-memory-order-repository.js';
import { StaticOrderItemCatalog } from '../../../src/orders/infrastructure/static-item-catalog.js';

const FIXED_DATE = new Date('2026-05-01T00:00:00.000Z');
const FIXED_ORDER_ID = '018f2f8d-d3d2-7b35-9f64-6e4c2e3f7a10';

describe('SubmitOrderService', () => {
  it('returns a confirmed order and persists it with the calculated total', async () => {
    const { orderRepository, service } = createTestHarness();

    const result = await service.execute({
      customer: {
        email: 'jane@example.com',
        name: 'Jane Doe',
      },
      items: [
        {
          id: 'item_1',
          quantity: 2,
        },
        {
          id: 'item_2',
          quantity: 1,
        },
      ],
    });

    expect(result).toEqual({
      orderId: FIXED_ORDER_ID,
      status: ORDER_STATUS.CONFIRMED,
      total: 4200,
    });

    const savedOrder = await orderRepository.findById(FIXED_ORDER_ID);

    expect(savedOrder).toEqual({
      createdAt: FIXED_DATE,
      customer: {
        email: 'jane@example.com',
        name: 'Jane Doe',
      },
      id: FIXED_ORDER_ID,
      items: [
        {
          id: 'item_1',
          lineTotal: 3000,
          quantity: 2,
          unitPrice: 1500,
        },
        {
          id: 'item_2',
          lineTotal: 1200,
          quantity: 1,
          unitPrice: 1200,
        },
      ],
      status: ORDER_STATUS.CONFIRMED,
      total: 4200,
    });
  });

  it('returns a rejected order when the total exceeds the approval threshold', async () => {
    const { orderRepository, service } = createTestHarness();

    const result = await service.execute({
      customer: {
        email: 'jane@example.com',
        name: 'Jane Doe',
      },
      items: [
        {
          id: 'item_4',
          quantity: 3,
        },
      ],
    });

    expect(result).toEqual({
      orderId: FIXED_ORDER_ID,
      reason: 'ORDER_TOTAL_TOO_HIGH',
      status: ORDER_STATUS.REJECTED,
    });

    const savedOrder = await orderRepository.findById(FIXED_ORDER_ID);

    expect(savedOrder).toMatchObject({
      id: FIXED_ORDER_ID,
      rejectionReason: 'ORDER_TOTAL_TOO_HIGH',
      status: ORDER_STATUS.REJECTED,
      total: 7500,
    });
  });

  it('normalizes duplicate items into a single persisted line item', async () => {
    const { orderRepository, service } = createTestHarness();

    await service.execute({
      customer: {
        email: 'jane@example.com',
        name: 'Jane Doe',
      },
      items: [
        {
          id: 'item_1',
          quantity: 1,
        },
        {
          id: 'item_1',
          quantity: 2,
        },
      ],
    });

    const savedOrder = await orderRepository.findById(FIXED_ORDER_ID);

    expect(savedOrder?.items).toEqual([
      {
        id: 'item_1',
        lineTotal: 4500,
        quantity: 3,
        unitPrice: 1500,
      },
    ]);
    expect(savedOrder?.total).toBe(4500);
  });

  it('throws when a submitted item is not present in the catalog', async () => {
    const { service } = createTestHarness();

    await expect(
      service.execute({
        customer: {
          email: 'jane@example.com',
          name: 'Jane Doe',
        },
        items: [
          {
            id: 'missing_item',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(UnknownOrderItemsError);
  });
});

function createTestHarness(): {
  readonly orderRepository: InMemoryOrderRepository;
  readonly service: SubmitOrderService;
} {
  const orderRepository = new InMemoryOrderRepository();
  const orderItemCatalog = new StaticOrderItemCatalog([
    {
      id: 'item_1',
      unitPrice: 1500,
    },
    {
      id: 'item_2',
      unitPrice: 1200,
    },
    {
      id: 'item_4',
      unitPrice: 2500,
    },
  ]);

  return {
    orderRepository,
    service: new SubmitOrderService({
      clock: {
        now: () => FIXED_DATE,
      },
      idGenerator: {
        create: () => FIXED_ORDER_ID,
      },
      orderDecisionPolicy: new ThresholdOrderDecisionPolicy(5000),
      orderItemCatalog,
      orderRepository,
    }),
  };
}
