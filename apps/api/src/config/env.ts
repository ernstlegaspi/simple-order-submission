import { z } from 'zod';

const booleanFlagSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const environmentSchema = z.object({
  API_CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  API_HOST: z.string().trim().min(1).default('0.0.0.0'),
  API_JSON_BODY_LIMIT: z.string().trim().min(1).default('100kb'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_SHUTDOWN_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(60_000)
    .default(10_000),
  API_TRUST_PROXY: booleanFlagSchema.default('false'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  ORDER_APPROVAL_THRESHOLD_CENTS: z.coerce
    .number()
    .int()
    .positive()
    .default(5_000),
});

export interface AppConfig {
  readonly cors: {
    readonly allowAnyOrigin: boolean;
    readonly allowedOrigins: readonly string[];
  };
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly orders: {
    readonly approvalThresholdCents: number;
  };
  readonly server: {
    readonly host: string;
    readonly jsonBodyLimit: string;
    readonly port: number;
    readonly shutdownTimeoutMs: number;
    readonly trustProxy: boolean;
  };
}

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsedEnvironment = environmentSchema.safeParse(environment);

  if (!parsedEnvironment.success) {
    throw new Error(formatEnvironmentErrors(parsedEnvironment.error));
  }

  const allowAnyOrigin = parsedEnvironment.data.API_CORS_ORIGINS.includes('*');

  return {
    cors: {
      allowAnyOrigin,
      allowedOrigins: allowAnyOrigin
        ? []
        : parsedEnvironment.data.API_CORS_ORIGINS,
    },
    nodeEnv: parsedEnvironment.data.NODE_ENV,
    orders: {
      approvalThresholdCents:
        parsedEnvironment.data.ORDER_APPROVAL_THRESHOLD_CENTS,
    },
    server: {
      host: parsedEnvironment.data.API_HOST,
      jsonBodyLimit: parsedEnvironment.data.API_JSON_BODY_LIMIT,
      port: parsedEnvironment.data.API_PORT,
      shutdownTimeoutMs: parsedEnvironment.data.API_SHUTDOWN_TIMEOUT_MS,
      trustProxy: parsedEnvironment.data.API_TRUST_PROXY,
    },
  };
}

function formatEnvironmentErrors(error: z.ZodError): string {
  const details = error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  return `Invalid environment configuration. ${details}`;
}
