import api from './api';
import { CreateFoodEntryDto, FoodEntry, DayNutrition } from '@dietistapp/shared';

export const entryService = {
  getEntries: async (clientId: string, from: string, to: string): Promise<FoodEntry[]> => {
    const response = await api.get(`/clients/${clientId}/entries`, {
      params: { from, to },
    });
    return response.data;
  },

  createEntry: async (clientId: string, dto: CreateFoodEntryDto): Promise<FoodEntry> => {
    const response = await api.post(`/clients/${clientId}/entries`, dto);
    return response.data;
  },

  updateEntry: async (entryId: string, dto: Partial<CreateFoodEntryDto>): Promise<FoodEntry> => {
    const response = await api.put(`/entries/${entryId}`, dto);
    return response.data;
  },

  deleteEntry: async (clientId: string, entryId: string): Promise<void> => {
    await api.delete(`/clients/${clientId}/entries/${entryId}`);
  },

  getDaySummary: async (clientId: string, date: string): Promise<DayNutrition> => {
    const response = await api.get(`/clients/${clientId}/summary/day`, {
      params: { date },
    });
    return response.data;
  },

  getRangeSummary: async (clientId: string, from: string, to: string) => {
    const response = await api.get(`/clients/${clientId}/summary/range`, {
      params: { from, to },
    });
    return response.data;
  },
};
