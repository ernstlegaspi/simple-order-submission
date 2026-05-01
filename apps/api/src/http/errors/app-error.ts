export interface ErrorResponseDetail {
  readonly message: string;
  readonly path?: string;
}

interface AppErrorOptions {
  readonly cause?: unknown;
  readonly code: string;
  readonly details?: readonly ErrorResponseDetail[];
  readonly statusCode: number;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly details: readonly ErrorResponseDetail[];
  public readonly statusCode: number;

  public constructor(message: string, options: AppErrorOptions) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.code = options.code;
    this.details = options.details ?? [];
    this.name = 'AppError';
    this.statusCode = options.statusCode;
  }
}
