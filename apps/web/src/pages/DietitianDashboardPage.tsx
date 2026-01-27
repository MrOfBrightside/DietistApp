import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

// TODO: Create clientService when backend /clients endpoint is implemented
// For now, this is a placeholder implementation showing the expected structure

interface ClientInfo {
  id: string;
  email: string;
  lastActiveDate?: string;
  totalEntries?: number;
}

interface DashboardStats {
  totalClients: number;
  activeToday: number;
  entriesThisWeek: number;
}

export default function DietitianDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeToday: 0,
    entriesThisWeek: 0,
  });
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // TODO: Implement when backend endpoints are ready:
      // - GET /api/dietitians/:dietitianId/clients
      // - GET /api/dietitians/:dietitianId/stats

      // Example implementation:
      // const clientsData = await clientService.getMyClients(user.id);
      // const statsData = await clientService.getStats(user.id);
      // setClients(clientsData);
      // setStats(statsData);

      // For now, show placeholder
      console.log('DietitianDashboard: Waiting for backend /clients endpoint');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dietist Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Totalt klienter</h3>
          <p className="text-4xl font-bold text-primary-600">{stats.totalClients}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Aktiva idag</h3>
          <p className="text-4xl font-bold text-green-600">{stats.activeToday}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Registreringar denna vecka</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.entriesThisWeek}</p>
        </div>
      </div>

      {/* Clients List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mina klienter</h2>
          <button className="btn btn-primary">Lägg till klient</button>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Inga klienter registrerade än</p>
            <p className="text-sm text-gray-400">
              Backend endpoint behövs: GET /api/dietitians/:id/clients
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <div>
                  <p className="font-medium">{client.email}</p>
                  <p className="text-sm text-gray-600">
                    {client.lastActiveDate
                      ? `Senast aktiv: ${client.lastActiveDate}`
                      : 'Aldrig aktiv'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {client.totalEntries || 0} registreringar
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800 mt-1">
                    Visa dagbok →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Implementation Notes - Remove in production */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">
          Implementation Notes (for developers)
        </h3>
        <div className="text-xs text-yellow-700 space-y-1">
          <p>• Backend endpoints needed:</p>
          <p className="ml-4">- GET /api/dietitians/:dietitianId/clients</p>
          <p className="ml-4">- GET /api/dietitians/:dietitianId/stats</p>
          <p className="ml-4">- POST /api/dietitians/:dietitianId/clients</p>
          <p>• Create clientService.ts with these methods</p>
          <p>• UI is ready to connect once endpoints are available</p>
        </div>
      </div>
    </div>
  );
}
