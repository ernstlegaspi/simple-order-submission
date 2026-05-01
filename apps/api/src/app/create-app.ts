import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import type { ApplicationContext } from '../core/application-context.js';
import {
  createErrorHandlerMiddleware,
  createNotFoundMiddleware,
} from '../http/middleware/error-handler-middleware.js';
import { createHttpLoggingMiddleware } from '../http/middleware/http-logging-middleware.js';
import { createRequestContextMiddleware } from '../http/middleware/request-context-middleware.js';
import { createOrdersRouter } from '../orders/http/create-orders-router.js';

export function createApp(context: ApplicationContext): express.Express {
  const app = express();

  if (context.config.server.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');

  app.use(createRequestContextMiddleware(context.idGenerator));
  app.use(createHttpLoggingMiddleware(context.logger, context.clock));
  app.use(helmet());
  app.use(
    cors({
      origin: context.config.cors.allowAnyOrigin
        ? true
        : [...context.config.cors.allowedOrigins],
    }),
  );
  app.use(
    express.json({
      limit: context.config.server.jsonBodyLimit,
    }),
  );
  app.use(createOrdersRouter(context));

  app.use(createNotFoundMiddleware());
  app.use(createErrorHandlerMiddleware(context.logger));

  return app;
}
