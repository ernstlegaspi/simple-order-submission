import { Router } from 'express';

import type { ApplicationContext } from '../../core/application-context.js';
import { asyncHandler } from '../../http/utils/async-handler.js';
import {
  submitOrderCommandSchema,
  submitOrderResponseSchema,
} from '../contracts/order-http-contract.js';

export function createOrdersRouter(context: ApplicationContext): Router {
  const router = Router();

  router.post(
    '/orders',
    asyncHandler(async (request, response) => {
      const command = submitOrderCommandSchema.parse(request.body);
      const result = await context.orders.submitOrder.execute(command);
      const payload = submitOrderResponseSchema.parse(result);

      response.status(200).json(payload);
    }),
  );

  return router;
}
