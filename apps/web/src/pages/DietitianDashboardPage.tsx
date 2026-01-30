import { useState, useEffect } from 'react';
import { clientService } from '../services/clientService';
import { ClientDto, DietitianStatisticsDto } from '@dietistapp/shared';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function DietitianDashboardPage() {
  const [statistics, setStatistics] = useState<DietitianStatisticsDto | null>(null);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, clientsData] = await Promise.all([
        clientService.getDietitianStatistics(),
        clientService.getClients(),
      ]);
      setStatistics(statsData);
      setClients(clientsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ett fel uppstod vid hämtning av data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Hämtar dashboard-data..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dietist Dashboard</h1>
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
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
            {statistics?.totalClients || 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Aktiva idag</h3>
          <p className="text-4xl font-bold text-green-600">
            {statistics?.activeToday || 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Registreringar denna vecka</h3>
          <p className="text-4xl font-bold text-blue-600">
            {statistics?.entriesThisWeek || 0}
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrerad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Senast uppdaterad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.updatedAt).toLocaleDateString('sv-SE')}
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
