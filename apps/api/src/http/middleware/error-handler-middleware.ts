import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { ZodError } from 'zod';

import type { Logger } from '../../infrastructure/logging/logger.js';
import { UnknownOrderItemsError } from '../../orders/domain/errors.js';
import { AppError } from '../errors/app-error.js';

interface BodyParserError extends Error {
  readonly expose?: boolean;
  readonly status?: number;
  readonly type?: string;
}

export function createNotFoundMiddleware(): (
  request: Request,
  response: Response,
  next: NextFunction,
) => void {
  return (_request, _response, next) => {
    next(
      new AppError('Route not found.', {
        code: 'ROUTE_NOT_FOUND',
        statusCode: 404,
      }),
    );
  };
}

export function createErrorHandlerMiddleware(
  logger: Logger,
): ErrorRequestHandler {
  return (error, request, response, _next) => {
    void _next;

    const appError = mapToAppError(error);

    if (appError.statusCode >= 500) {
      logger.error('Unhandled request error.', {
        code: appError.code,
        message: appError.message,
        path: request.originalUrl,
        requestId: request.requestId,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    response.status(appError.statusCode).json({
      error: {
        code: appError.code,
        details: appError.details,
        message: appError.message,
      },
      requestId: request.requestId,
    });
  };
}

function mapToAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof UnknownOrderItemsError) {
    return new AppError('One or more submitted items are not supported.', {
      code: 'UNKNOWN_ORDER_ITEM',
      details: error.itemIds.map((itemId) => ({
        message: `Unknown item id "${itemId}".`,
        path: 'items',
      })),
      statusCode: 400,
    });
  }

  if (error instanceof ZodError) {
    return new AppError('Request validation failed.', {
      code: 'INVALID_REQUEST',
      details: error.issues.map((issue) =>
        createErrorResponseDetail(issue.message, formatIssuePath(issue.path)),
      ),
      statusCode: 400,
    });
  }

  if (isBodyParserError(error, 'entity.parse.failed')) {
    return new AppError('Request body must be valid JSON.', {
      code: 'INVALID_JSON',
      statusCode: 400,
    });
  }

  if (isBodyParserError(error, 'entity.too.large')) {
    return new AppError('Request body is too large.', {
      code: 'PAYLOAD_TOO_LARGE',
      statusCode: 413,
    });
  }

  return new AppError('An unexpected error occurred.', {
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
  });
}

function formatIssuePath(
  path: readonly (string | number)[],
): string | undefined {
  if (path.length === 0) {
    return undefined;
  }

  return path.reduce<string>((formattedPath, segment) => {
    if (typeof segment === 'number') {
      return `${formattedPath}[${segment}]`;
    }

    return formattedPath.length === 0 ? segment : `${formattedPath}.${segment}`;
  }, '');
}

function isBodyParserError(
  error: unknown,
  type: string,
): error is BodyParserError {
  return (
    error instanceof Error &&
    'type' in error &&
    (error as BodyParserError).type === type
  );
}

function createErrorResponseDetail(
  message: string,
  path?: string,
): {
  readonly message: string;
  readonly path?: string;
} {
  return path === undefined ? { message } : { message, path };
}
