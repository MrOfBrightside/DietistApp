import { useState } from 'react';

export default function ClientDiaryPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Min dagbok</h1>
        <input
          type="date"
          className="input"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Frukost */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Frukost</h2>
          <p className="text-gray-500">Inga registreringar än</p>
          <button className="btn btn-primary mt-4">Lägg till livsmedel</button>
        </div>

        {/* Lunch */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Lunch</h2>
          <p className="text-gray-500">Inga registreringar än</p>
          <button className="btn btn-primary mt-4">Lägg till livsmedel</button>
        </div>

        {/* Middag */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Middag</h2>
          <p className="text-gray-500">Inga registreringar än</p>
          <button className="btn btn-primary mt-4">Lägg till livsmedel</button>
        </div>

        {/* Mellanmål */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Mellanmål</h2>
          <p className="text-gray-500">Inga registreringar än</p>
          <button className="btn btn-primary mt-4">Lägg till livsmedel</button>
        </div>
      </div>

      {/* Dagens summering */}
      <div className="card bg-primary-50 border-primary-200">
        <h2 className="text-xl font-semibold mb-4">Dagens summering</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Energi</p>
            <p className="text-2xl font-bold">0 kcal</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Protein</p>
            <p className="text-2xl font-bold">0 g</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Kolhydrater</p>
            <p className="text-2xl font-bold">0 g</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fett</p>
            <p className="text-2xl font-bold">0 g</p>
          </div>
        </div>
      </div>
    </div>
  );
}
