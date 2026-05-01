import type { NextFunction, Request, Response } from 'express';

import type { Clock } from '../../core/application-context.js';
import type { Logger } from '../../infrastructure/logging/logger.js';

export function createHttpLoggingMiddleware(
  logger: Logger,
  clock: Clock,
): (request: Request, response: Response, next: NextFunction) => void {
  return (request, response, next) => {
    const startedAt = clock.now().toISOString();
    const startTime = performance.now();

    response.on('finish', () => {
      logger.info('HTTP request completed.', {
        durationMs: Number((performance.now() - startTime).toFixed(2)),
        method: request.method,
        path: request.originalUrl,
        requestId: request.requestId,
        startedAt,
        statusCode: response.statusCode,
      });
    });

    next();
  };
}
