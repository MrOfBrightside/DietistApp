import api from './api';
import { LivsmedelSearchResult, LivsmedelFoodItem, LivsmedelNutrientData } from '@dietistapp/shared';

export const foodService = {
  searchFoods: async (query: string, limit: number = 20): Promise<LivsmedelSearchResult> => {
    const response = await api.get('/foods/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  getFoodByNumber: async (foodNumber: string): Promise<LivsmedelFoodItem> => {
    const response = await api.get(`/foods/${foodNumber}`);
    return response.data;
  },

  getNutrientsByFoodNumber: async (foodNumber: string): Promise<LivsmedelNutrientData & { _cache?: any }> => {
    const response = await api.get(`/foods/${foodNumber}/nutrients`);
    return response.data;
  },
};
