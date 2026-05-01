import type { NextFunction, Request, Response } from 'express';

import type { IdGenerator } from '../../core/application-context.js';

export function createRequestContextMiddleware(
  idGenerator: IdGenerator,
): (request: Request, response: Response, next: NextFunction) => void {
  return (request, response, next) => {
    const requestId =
      request.header('x-request-id')?.trim() || idGenerator.create();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    next();
  };
}
