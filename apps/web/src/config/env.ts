import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .url('VITE_API_BASE_URL must be a valid URL.')
    .default('http://localhost:3001')
    .transform((value) => value.replace(/\/+$/, '')),
});

export const env = envSchema.parse(import.meta.env);
