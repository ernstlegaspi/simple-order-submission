import type { Clock, IdGenerator } from '../../core/application-context.js';
import {
  InvalidOrderSubmissionError,
  UnknownOrderItemsError,
} from '../domain/errors.js';
import type {
  Order,
  OrderCustomer,
  OrderItem,
  OrderRejectionReason,
} from '../domain/order.js';
import { ORDER_REJECTION_REASON, ORDER_STATUS } from '../domain/order.js';
import type {
  OrderDecision,
  OrderDecisionPolicy,
} from '../domain/order-decision-policy.js';
import type { OrderItemCatalog } from '../domain/order-item-catalog.js';
import type { OrderRepository } from '../domain/order-repository.js';

export interface SubmitOrderCommand {
  readonly customer: {
    readonly email: string;
    readonly name: string;
  };
  readonly items: readonly {
    readonly id: string;
    readonly quantity: number;
  }[];
}

export type SubmitOrderResult =
  | {
      readonly orderId: string;
      readonly status: typeof ORDER_STATUS.CONFIRMED;
      readonly total: number;
    }
  | {
      readonly orderId: string;
      readonly reason: OrderRejectionReason;
      readonly status: typeof ORDER_STATUS.REJECTED;
    };

interface SubmitOrderServiceDependencies {
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  readonly orderDecisionPolicy: OrderDecisionPolicy;
  readonly orderItemCatalog: OrderItemCatalog;
  readonly orderRepository: OrderRepository;
}

interface NormalizedSubmitOrderCommand {
  readonly customer: OrderCustomer;
  readonly items: readonly {
    readonly id: string;
    readonly quantity: number;
  }[];
}

export class SubmitOrderService {
  private readonly clock: Clock;
  private readonly idGenerator: IdGenerator;
  private readonly orderDecisionPolicy: OrderDecisionPolicy;
  private readonly orderItemCatalog: OrderItemCatalog;
  private readonly orderRepository: OrderRepository;

  public constructor(dependencies: SubmitOrderServiceDependencies) {
    this.clock = dependencies.clock;
    this.idGenerator = dependencies.idGenerator;
    this.orderDecisionPolicy = dependencies.orderDecisionPolicy;
    this.orderItemCatalog = dependencies.orderItemCatalog;
    this.orderRepository = dependencies.orderRepository;
  }

  public async execute(
    command: SubmitOrderCommand,
  ): Promise<SubmitOrderResult> {
    const normalizedCommand = normalizeCommand(command);
    const pricedItems = await this.priceItems(normalizedCommand.items);
    const total = pricedItems.reduce(
      (runningTotal, item) => runningTotal + item.lineTotal,
      0,
    );
    const orderId = this.idGenerator.create();
    const decision = this.orderDecisionPolicy.decide(total);
    const order = buildOrder({
      customer: normalizedCommand.customer,
      decision,
      id: orderId,
      items: pricedItems,
      now: this.clock.now(),
      total,
    });

    await this.orderRepository.save(order);

    if (decision.status === ORDER_STATUS.CONFIRMED) {
      return {
        orderId,
        status: ORDER_STATUS.CONFIRMED,
        total,
      };
    }

    return {
      orderId,
      reason: decision.reason,
      status: ORDER_STATUS.REJECTED,
    };
  }

  private async priceItems(
    items: NormalizedSubmitOrderCommand['items'],
  ): Promise<readonly OrderItem[]> {
    const itemIds = items.map((item) => item.id);
    const catalogItems = await this.orderItemCatalog.findByIds(itemIds);
    const missingItemIds = itemIds.filter(
      (itemId) => !catalogItems.has(itemId),
    );

    if (missingItemIds.length > 0) {
      throw new UnknownOrderItemsError(missingItemIds);
    }

    return items.map((item) => {
      const catalogItem = catalogItems.get(item.id);

      if (catalogItem === undefined) {
        throw new UnknownOrderItemsError([item.id]);
      }

      return {
        id: item.id,
        lineTotal: catalogItem.unitPrice * item.quantity,
        quantity: item.quantity,
        unitPrice: catalogItem.unitPrice,
      };
    });
  }
}

function buildOrder(input: {
  readonly customer: OrderCustomer;
  readonly decision: OrderDecision;
  readonly id: string;
  readonly items: readonly OrderItem[];
  readonly now: Date;
  readonly total: number;
}): Order {
  if (input.decision.status === ORDER_STATUS.CONFIRMED) {
    return {
      createdAt: input.now,
      customer: input.customer,
      id: input.id,
      items: input.items,
      status: ORDER_STATUS.CONFIRMED,
      total: input.total,
    };
  }

  return {
    createdAt: input.now,
    customer: input.customer,
    id: input.id,
    items: input.items,
    rejectionReason: input.decision.reason,
    status: ORDER_STATUS.REJECTED,
    total: input.total,
  };
}

function normalizeCommand(
  command: SubmitOrderCommand,
): NormalizedSubmitOrderCommand {
  const issues: string[] = [];
  const normalizedItems = new Map<string, number>();
  const customerName = command.customer.name.trim();
  const customerEmail = command.customer.email.trim();

  if (customerName.length === 0) {
    issues.push('customer.name is required.');
  }

  if (customerEmail.length === 0) {
    issues.push('customer.email is required.');
  }

  if (command.items.length === 0) {
    issues.push('At least one item must be provided.');
  }

  for (const [index, item] of command.items.entries()) {
    const itemId = item.id.trim();

    if (itemId.length === 0) {
      issues.push(`items[${index}].id is required.`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      issues.push(`items[${index}].quantity must be a positive integer.`);
      continue;
    }

    if (itemId.length === 0) {
      continue;
    }

    normalizedItems.set(
      itemId,
      (normalizedItems.get(itemId) ?? 0) + item.quantity,
    );
  }

  if (issues.length > 0) {
    throw new InvalidOrderSubmissionError(issues);
  }

  return {
    customer: {
      email: customerEmail,
      name: customerName,
    },
    items: [...normalizedItems.entries()].map(([id, quantity]) => ({
      id,
      quantity,
    })),
  };
}

export const orderRejectionReason = ORDER_REJECTION_REASON;
