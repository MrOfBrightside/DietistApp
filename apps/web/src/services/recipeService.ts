import api from './api';
import { Recipe, CreateRecipeDto, UpdateRecipeDto } from '@dietistapp/shared';

export const recipeService = {
  getRecipes: async (): Promise<Recipe[]> => {
    const response = await api.get('/recipes');
    return response.data;
  },

  createRecipe: async (dto: CreateRecipeDto): Promise<Recipe> => {
    const response = await api.post('/recipes', dto);
    return response.data;
  },

  getRecipeById: async (id: string): Promise<Recipe> => {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },

  updateRecipe: async (id: string, dto: UpdateRecipeDto): Promise<Recipe> => {
    const response = await api.put(`/recipes/${id}`, dto);
    return response.data;
  },

  deleteRecipe: async (id: string): Promise<void> => {
    await api.delete(`/recipes/${id}`);
  },
};
