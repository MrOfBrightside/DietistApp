import { MealType, EntryType } from '../types/enums';

export interface FoodEntry {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  entryType: EntryType;
  foodNumber?: string; // För FOOD typ
  foodNameSnapshot: string;
  grams: number;
  recipeId?: string; // För RECIPE typ
  time?: string; // HH:MM
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
