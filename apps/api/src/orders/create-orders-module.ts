import type { AppConfig } from '../config/env.js';
import type { Clock, IdGenerator } from '../core/application-context.js';
import type { Logger } from '../infrastructure/logging/logger.js';
import { SubmitOrderService } from './application/submit-order-service.js';
import { ThresholdOrderDecisionPolicy } from './domain/order-decision-policy.js';
import type { OrderItemCatalog } from './domain/order-item-catalog.js';
import type { OrderRepository } from './domain/order-repository.js';
import { InMemoryOrderRepository } from './infrastructure/in-memory-order-repository.js';
import {
  DEFAULT_ORDER_ITEM_CATALOG,
  StaticOrderItemCatalog,
} from './infrastructure/static-item-catalog.js';

export interface OrdersModule {
  readonly orderItemCatalog: OrderItemCatalog;
  readonly orderRepository: OrderRepository;
  readonly submitOrder: SubmitOrderService;
}

interface CreateOrdersModuleDependencies {
  readonly clock: Clock;
  readonly config: AppConfig;
  readonly idGenerator: IdGenerator;
  readonly logger: Logger;
}

export function createOrdersModule(
  dependencies: CreateOrdersModuleDependencies,
): OrdersModule {
  const orderRepository = new InMemoryOrderRepository();
  const orderItemCatalog = new StaticOrderItemCatalog(
    DEFAULT_ORDER_ITEM_CATALOG,
  );
  const orderDecisionPolicy = new ThresholdOrderDecisionPolicy(
    dependencies.config.orders.approvalThresholdCents,
  );

  dependencies.logger.info('Orders module initialized.', {
    approvalThresholdCents: dependencies.config.orders.approvalThresholdCents,
    catalogSize: DEFAULT_ORDER_ITEM_CATALOG.length,
  });

  return {
    orderItemCatalog,
    orderRepository,
    submitOrder: new SubmitOrderService({
      clock: dependencies.clock,
      idGenerator: dependencies.idGenerator,
      orderDecisionPolicy,
      orderItemCatalog,
      orderRepository,
    }),
  };
}
