import { z } from 'zod';

import { ORDER_REJECTION_REASON, ORDER_STATUS } from '../domain/order.js';

export const submitOrderCommandSchema = z
  .object({
    customer: z
      .object({
        email: z
          .string()
          .trim()
          .min(1, 'Customer email is required.')
          .email('Customer email must be a valid email address.'),
        name: z.string().trim().min(1, 'Customer name is required.'),
      })
      .strict(),
    items: z
      .array(
        z
          .object({
            id: z.string().trim().min(1, 'Item id is required.'),
            quantity: z
              .number({
                invalid_type_error: 'Item quantity must be a number.',
              })
              .int('Item quantity must be an integer.')
              .positive('Item quantity must be greater than 0.'),
          })
          .strict(),
      )
      .min(1, 'At least one item must be provided.'),
  })
  .strict();

export const confirmedOrderResponseSchema = z
  .object({
    orderId: z.string().uuid(),
    status: z.literal(ORDER_STATUS.CONFIRMED),
    total: z.number().int().nonnegative(),
  })
  .strict();

export const rejectedOrderResponseSchema = z
  .object({
    orderId: z.string().uuid(),
    reason: z.enum([ORDER_REJECTION_REASON.ORDER_TOTAL_TOO_HIGH]),
    status: z.literal(ORDER_STATUS.REJECTED),
  })
  .strict();

export const submitOrderResponseSchema = z.union([
  confirmedOrderResponseSchema,
  rejectedOrderResponseSchema,
]);

export type SubmitOrderCommand = z.infer<typeof submitOrderCommandSchema>;
export type SubmitOrderResponse = z.infer<typeof submitOrderResponseSchema>;
