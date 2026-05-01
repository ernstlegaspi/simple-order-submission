import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import type { ApplicationContext } from '../core/application-context.js';
import { createHttpLoggingMiddleware } from '../http/middleware/http-logging-middleware.js';
import { createRequestContextMiddleware } from '../http/middleware/request-context-middleware.js';

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

  app.use((_request, response) => {
    response.status(404).json({
      message: 'Route not found.',
    });
  });

  return app;
}
