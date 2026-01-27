import { z } from 'zod';
import { MealType, EntryType } from '../types/enums';

export const createFoodEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum måste vara i format YYYY-MM-DD'),
  mealType: z.nativeEnum(MealType),
  entryType: z.nativeEnum(EntryType),
  foodNumber: z.string().optional(),
  foodNameSnapshot: z.string().min(1, 'Livsmedelsnamn krävs'),
  grams: z.number().positive('Gram måste vara positivt'),
  recipeId: z.string().uuid().optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Tid måste vara i format HH:MM').optional(),
  comment: z.string().max(500, 'Kommentar får max vara 500 tecken').optional(),
});

export const updateFoodEntrySchema = createFoodEntrySchema.partial();

export const getEntriesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getDaySummaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateFoodEntryDto = z.infer<typeof createFoodEntrySchema>;
export type UpdateFoodEntryDto = z.infer<typeof updateFoodEntrySchema>;
export type GetEntriesQueryDto = z.infer<typeof getEntriesQuerySchema>;
export type GetDaySummaryQueryDto = z.infer<typeof getDaySummaryQuerySchema>;
