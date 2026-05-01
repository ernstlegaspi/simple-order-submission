import { startServer } from './server.js';

void startServer().catch((error: unknown) => {
  console.error('Failed to start API server.', error);
  process.exitCode = 1;
});
