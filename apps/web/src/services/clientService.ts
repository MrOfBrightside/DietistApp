import api from './api';
import { ClientDto, DietitianStatisticsDto } from '@dietistapp/shared';

export const clientService = {
  getClients: async (): Promise<ClientDto[]> => {
    const response = await api.get('/clients');
    return response.data;
  },

  getDietitianStatistics: async (): Promise<DietitianStatisticsDto> => {
    const response = await api.get('/dietitian/statistics');
    return response.data;
  },
};
