export interface ClientDto {
  id: string;
  userId: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DietitianStatisticsDto {
  totalClients: number;
  activeToday: number;
  entriesThisWeek: number;
}
