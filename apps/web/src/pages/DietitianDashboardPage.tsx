export default function DietitianDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dietist Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Totalt klienter</h3>
          <p className="text-4xl font-bold text-primary-600">0</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Aktiva idag</h3>
          <p className="text-4xl font-bold text-green-600">0</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Registreringar denna vecka</h3>
          <p className="text-4xl font-bold text-blue-600">0</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Mina klienter</h2>
        <p className="text-gray-500">Inga klienter registrerade än</p>
      </div>
    </div>
  );
}
