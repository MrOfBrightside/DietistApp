export interface Recipe {
  id: string;
  ownerId: string;
  name: string;
  servings: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeItem {
  id: string;
  recipeId: string;
  foodNumber: string;
  foodNameSnapshot: string;
  grams: number;
  createdAt: Date;
}
