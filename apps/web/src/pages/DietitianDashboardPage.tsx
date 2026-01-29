import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { DashboardStatsDto, ClientListItemDto } from '@dietistapp/shared';

export default function DietitianDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [clients, setClients] = useState<ClientListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [statsData, clientsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getClients(),
        ]);

        setStats(statsData);
        setClients(clientsData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Kunde inte ladda dashboard-data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Aldrig';
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dietist Dashboard</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Laddar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dietist Dashboard</h1>
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dietist Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Totalt klienter</h3>
          <p className="text-4xl font-bold text-primary-600">
            {stats?.totalClients ?? 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Aktiva idag</h3>
          <p className="text-4xl font-bold text-green-600">
            {stats?.activeToday ?? 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Registreringar denna vecka</h3>
          <p className="text-4xl font-bold text-blue-600">
            {stats?.registrationsThisWeek ?? 0}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Mina klienter</h2>
        {clients.length === 0 ? (
          <p className="text-gray-500">Inga klienter registrerade än</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrerad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Senast aktiv
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(client.lastActive)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
