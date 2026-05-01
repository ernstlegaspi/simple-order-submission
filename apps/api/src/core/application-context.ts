import { v7 as uuidv7 } from 'uuid';

import type { AppConfig } from '../config/env.js';
import { createLogger, type Logger } from '../infrastructure/logging/logger.js';
import {
  createOrdersModule,
  type OrdersModule,
} from '../orders/create-orders-module.js';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  create(): string;
}

export interface ApplicationContext {
  readonly clock: Clock;
  readonly config: AppConfig;
  readonly idGenerator: IdGenerator;
  readonly logger: Logger;
  readonly orders: OrdersModule;
}

interface ApplicationContextOverrides {
  readonly clock?: Clock;
  readonly idGenerator?: IdGenerator;
  readonly logger?: Logger;
  readonly orders?: OrdersModule;
}

export function createApplicationContext(
  config: AppConfig,
  overrides: ApplicationContextOverrides = {},
): ApplicationContext {
  const clock =
    overrides.clock ??
    ({
      now: () => new Date(),
    } satisfies Clock);
  const idGenerator =
    overrides.idGenerator ??
    ({
      create: () => uuidv7(),
    } satisfies IdGenerator);
  const logger = overrides.logger ?? createLogger();

  return {
    clock,
    config,
    idGenerator,
    logger,
    orders:
      overrides.orders ??
      createOrdersModule({
        clock,
        config,
        idGenerator,
        logger,
      }),
  };
}
