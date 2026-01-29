export interface DashboardStatsDto {
  totalClients: number;
  activeToday: number;
  registrationsThisWeek: number;
}

export interface ClientListItemDto {
  id: string;
  email: string;
  createdAt: Date;
  lastActive: Date | null;
}
