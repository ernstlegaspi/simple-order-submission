import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app/create-app.js';
import type { AppConfig } from '../../src/config/env.js';
import { createApplicationContext } from '../../src/core/application-context.js';
import type { Logger } from '../../src/infrastructure/logging/logger.js';

const FIXED_ORDER_ID = '018f2f8d-d3d2-7b35-9f64-6e4c2e3f7a10';

describe('POST /orders', () => {
  it('returns a confirmed order payload for valid requests under the threshold', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/orders')
      .set('x-request-id', 'req-confirmed')
      .send({
        customer: {
          email: 'jane@example.com',
          name: 'Jane Doe',
        },
        items: [
          {
            id: 'item_1',
            quantity: 2,
          },
          {
            id: 'item_2',
            quantity: 1,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-confirmed');
    expect(response.body).toEqual({
      orderId: FIXED_ORDER_ID,
      status: 'CONFIRMED',
      total: 4200,
    });
  });

  it('returns a rejected order payload when the total is above the threshold', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/orders')
      .set('x-request-id', 'req-rejected')
      .send({
        customer: {
          email: 'jane@example.com',
          name: 'Jane Doe',
        },
        items: [
          {
            id: 'item_4',
            quantity: 3,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      orderId: FIXED_ORDER_ID,
      reason: 'ORDER_TOTAL_TOO_HIGH',
      status: 'REJECTED',
    });
  });

  it('returns a structured validation error for invalid input', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/orders')
      .set('x-request-id', 'req-invalid')
      .send({
        customer: {
          email: 'not-an-email',
          name: '',
        },
        items: [],
      });
    const errorBody = response.body as {
      readonly error: {
        readonly code: string;
        readonly details: readonly {
          readonly message: string;
          readonly path: string;
        }[];
        readonly message: string;
      };
      readonly requestId: string;
    };

    expect(response.status).toBe(400);
    expect(errorBody).toMatchObject({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request validation failed.',
      },
      requestId: 'req-invalid',
    });
    expect(errorBody.error.details).toEqual(
      expect.arrayContaining([
        {
          message: 'Customer name is required.',
          path: 'customer.name',
        },
        {
          message: 'Customer email must be a valid email address.',
          path: 'customer.email',
        },
        {
          message: 'At least one item must be provided.',
          path: 'items',
        },
      ]),
    );
  });

  it('returns a structured domain error for unknown items', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/orders')
      .set('x-request-id', 'req-unknown-item')
      .send({
        customer: {
          email: 'jane@example.com',
          name: 'Jane Doe',
        },
        items: [
          {
            id: 'missing_item',
            quantity: 1,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'UNKNOWN_ORDER_ITEM',
        details: [
          {
            message: 'Unknown item id "missing_item".',
            path: 'items',
          },
        ],
        message: 'One or more submitted items are not supported.',
      },
      requestId: 'req-unknown-item',
    });
  });

  it('returns a structured error for malformed JSON payloads', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/orders')
      .set('Content-Type', 'application/json')
      .set('x-request-id', 'req-invalid-json')
      .send('{"customer":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_JSON',
        details: [],
        message: 'Request body must be valid JSON.',
      },
      requestId: 'req-invalid-json',
    });
  });
});

function createTestApp() {
  const config: AppConfig = {
    cors: {
      allowAnyOrigin: true,
      allowedOrigins: [],
    },
    nodeEnv: 'test',
    orders: {
      approvalThresholdCents: 5000,
    },
    server: {
      host: '127.0.0.1',
      jsonBodyLimit: '100kb',
      port: 3001,
      shutdownTimeoutMs: 1000,
      trustProxy: false,
    },
  };

  return createApp(
    createApplicationContext(config, {
      clock: {
        now: () => new Date('2026-05-01T00:00:00.000Z'),
      },
      idGenerator: {
        create: () => FIXED_ORDER_ID,
      },
      logger: createSilentLogger(),
    }),
  );
}

function createSilentLogger(): Logger {
  return {
    error: () => undefined,
    info: () => undefined,
  };
}
