import 'dotenv/config';

import { createServer, type Server } from 'node:http';
import { once } from 'node:events';

import { createApp } from './app/create-app.js';
import { loadConfig } from './config/env.js';
import { createApplicationContext } from './core/application-context.js';

export async function startServer(): Promise<Server> {
  const config = loadConfig();
  const context = createApplicationContext(config);
  const app = createApp(context);
  const server = createServer(app);

  await listen(server, config.server.host, config.server.port);

  context.logger.info('API server started.', {
    host: config.server.host,
    port: config.server.port,
  });

  registerShutdownHandlers(server, context);

  return server;
}

async function listen(
  server: Server,
  host: string,
  port: number,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function registerShutdownHandlers(
  server: Server,
  context: ReturnType<typeof createApplicationContext>,
): void {
  const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of shutdownSignals) {
    process.once(signal, () => {
      void shutdownServer(server, signal, context);
    });
  }
}

async function shutdownServer(
  server: Server,
  signal: NodeJS.Signals,
  context: ReturnType<typeof createApplicationContext>,
): Promise<void> {
  context.logger.info('Shutdown signal received.', {
    signal,
  });

  server.close();

  const timeout = setTimeout(() => {
    context.logger.error('Server shutdown timed out.', {
      timeoutMs: context.config.server.shutdownTimeoutMs,
    });

    process.exitCode = 1;
  }, context.config.server.shutdownTimeoutMs);

  timeout.unref();

  await once(server, 'close');
  clearTimeout(timeout);

  context.logger.info('API server stopped.');
}
