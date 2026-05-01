import { z } from 'zod';

export const submitOrderFormSchema = z
  .object({
    customer: z
      .object({
        email: z
          .string()
          .trim()
          .min(1, 'Customer email is required.')
          .pipe(
            z.string().email('Customer email must be a valid email address.'),
          ),
        name: z.string().trim().min(1, 'Customer name is required.'),
      })
      .strict(),
    items: z
      .array(
        z
          .object({
            id: z.string().trim().min(1, 'Item id is required.'),
            quantity: z.coerce
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
    status: z.literal('CONFIRMED'),
    total: z.number().int().nonnegative(),
  })
  .strict();

export const rejectedOrderResponseSchema = z
  .object({
    orderId: z.string().uuid(),
    reason: z.literal('ORDER_TOTAL_TOO_HIGH'),
    status: z.literal('REJECTED'),
  })
  .strict();

export const submitOrderResponseSchema = z.union([
  confirmedOrderResponseSchema,
  rejectedOrderResponseSchema,
]);

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        details: z.array(
          z.object({
            message: z.string(),
            path: z.string().optional(),
          }),
        ),
        message: z.string(),
      })
      .strict(),
    requestId: z.string(),
  })
  .strict();

export type ApiErrorDetail = z.infer<
  typeof apiErrorResponseSchema
>['error']['details'][number];
export type SubmitOrderPayload = z.infer<typeof submitOrderFormSchema>;
export type SubmitOrderResponse = z.infer<typeof submitOrderResponseSchema>;
