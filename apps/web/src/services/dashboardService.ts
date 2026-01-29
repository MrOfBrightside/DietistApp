import api from './api';
import { DashboardStatsDto, ClientListItemDto } from '@dietistapp/shared';

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsDto> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getClients: async (): Promise<ClientListItemDto[]> => {
    const response = await api.get('/dashboard/clients');
    return response.data;
  },
};
