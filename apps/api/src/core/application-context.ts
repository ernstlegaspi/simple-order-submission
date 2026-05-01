import { v7 as uuidv7 } from 'uuid';

import type { AppConfig } from '../config/env.js';
import { createLogger, type Logger } from '../infrastructure/logging/logger.js';

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
}

export function createApplicationContext(
  config: AppConfig,
): ApplicationContext {
  return {
    clock: {
      now: () => new Date(),
    },
    config,
    idGenerator: {
      create: () => uuidv7(),
    },
    logger: createLogger(),
  };
}
