import { z } from 'zod';

export const searchFoodsQuerySchema = z.object({
  q: z.string().min(2, 'Sökfråga måste vara minst 2 tecken'),
  limit: z.number().int().positive().max(100).optional(),
});

export type SearchFoodsQueryDto = z.infer<typeof searchFoodsQuerySchema>;
