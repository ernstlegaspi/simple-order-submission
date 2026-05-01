export interface Logger {
  error(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
}

export function createLogger(): Logger {
  return {
    error: (message, metadata = {}) => {
      console.error(
        JSON.stringify({
          level: 'error',
          message,
          ...metadata,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    info: (message, metadata = {}) => {
      console.info(
        JSON.stringify({
          level: 'info',
          message,
          ...metadata,
          timestamp: new Date().toISOString(),
        }),
      );
    },
  };
}
