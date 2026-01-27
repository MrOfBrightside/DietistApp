import { z } from 'zod';

export const recipeItemSchema = z.object({
  foodNumber: z.string().min(1, 'Livsmedelsnummer krävs'),
  foodNameSnapshot: z.string().min(1, 'Livsmedelsnamn krävs'),
  grams: z.number().positive('Gram måste vara positivt'),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1, 'Receptnamn krävs').max(200, 'Receptnamn får max vara 200 tecken'),
  servings: z.number().int().positive('Antal portioner måste vara positivt'),
  description: z.string().max(1000, 'Beskrivning får max vara 1000 tecken').optional(),
  items: z.array(recipeItemSchema).min(1, 'Minst en ingrediens krävs'),
});

export const updateRecipeSchema = createRecipeSchema.partial().extend({
  items: z.array(recipeItemSchema).optional(),
});

export type RecipeItemDto = z.infer<typeof recipeItemSchema>;
export type CreateRecipeDto = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeDto = z.infer<typeof updateRecipeSchema>;
