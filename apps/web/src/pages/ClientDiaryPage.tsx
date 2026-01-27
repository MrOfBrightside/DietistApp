import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { entryService } from '../services/entryService';
import { foodService } from '../services/foodService';
import { FoodEntry, MealType, EntryType, DayNutrition, NUTRIENT_CODES } from '@dietistapp/shared';

export default function ClientDiaryPage() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [daySummary, setDaySummary] = useState<DayNutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.BREAKFAST);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  // Food search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);

  // Form state
  const [grams, setGrams] = useState('100');
  const [time, setTime] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [selectedDate, user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [entriesData, summaryData] = await Promise.all([
        entryService.getEntries(user.id, selectedDate, selectedDate),
        entryService.getDaySummary(user.id, selectedDate),
      ]);
      setEntries(entriesData);
      setDaySummary(summaryData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const result = await foodService.searchFoods(query);
      setSearchResults(result.livsmedel || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddEntry = async () => {
    if (!user || !selectedFood) return;

    try {
      const dto = {
        date: selectedDate,
        mealType: selectedMealType,
        entryType: EntryType.FOOD,
        foodNumber: selectedFood.nummer,
        foodNameSnapshot: selectedFood.namn,
        grams: parseFloat(grams),
        time: time || undefined,
        comment: comment || undefined,
      };

      if (editingEntry) {
        await entryService.updateEntry(editingEntry.id, dto);
      } else {
        await entryService.createEntry(user.id, dto);
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Kunde inte spara registreringen');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user || !confirm('Är du säker på att du vill ta bort denna registrering?')) return;

    try {
      await entryService.deleteEntry(user.id, entryId);
      loadData();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Kunde inte ta bort registreringen');
    }
  };

  const handleEditEntry = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setSelectedMealType(entry.mealType);
    setGrams(entry.grams.toString());
    setTime(entry.time || '');
    setComment(entry.comment || '');
    setSelectedFood({
      nummer: entry.foodNumber,
      namn: entry.foodNameSnapshot,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingEntry(null);
    setSelectedFood(null);
    setSearchQuery('');
    setSearchResults([]);
    setGrams('100');
    setTime('');
    setComment('');
  };

  const openAddModal = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowAddModal(true);
  };

  const getMealEntries = (mealType: MealType) => {
    return entries.filter((e) => e.mealType === mealType);
  };

  const getNutrientValue = (code: string): number => {
    if (!daySummary?.daySummary?.nutrients) return 0;
    const nutrient = daySummary.daySummary.nutrients.find((n) => n.code === code);
    return nutrient?.value || 0;
  };

  const mealTypeLabels: Record<MealType, string> = {
    [MealType.BREAKFAST]: 'Frukost',
    [MealType.LUNCH]: 'Lunch',
    [MealType.DINNER]: 'Middag',
    [MealType.SNACK]: 'Mellanmål',
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
        {Object.values(MealType).map((mealType) => {
          const mealEntries = getMealEntries(mealType);
          return (
            <div key={mealType} className="card">
              <h2 className="text-xl font-semibold mb-4">{mealTypeLabels[mealType]}</h2>
              {mealEntries.length === 0 ? (
                <p className="text-gray-500 mb-4">Inga registreringar än</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {mealEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{entry.foodNameSnapshot}</p>
                        <p className="text-sm text-gray-600">
                          {entry.grams}g
                          {entry.time && ` • ${entry.time}`}
                          {entry.comment && ` • ${entry.comment}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Ta bort
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => openAddModal(mealType)}
                className="btn btn-primary"
              >
                Lägg till livsmedel
              </button>
            </div>
          );
        })}
      </div>

      {/* Dagens summering */}
      <div className="card bg-primary-50 border-primary-200">
        <h2 className="text-xl font-semibold mb-4">Dagens summering</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Energi</p>
            <p className="text-2xl font-bold">
              {Math.round(getNutrientValue(NUTRIENT_CODES.ENERGY))} kcal
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Protein</p>
            <p className="text-2xl font-bold">
              {Math.round(getNutrientValue(NUTRIENT_CODES.PROTEIN))} g
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Kolhydrater</p>
            <p className="text-2xl font-bold">
              {Math.round(getNutrientValue(NUTRIENT_CODES.CARBOHYDRATE))} g
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fett</p>
            <p className="text-2xl font-bold">
              {Math.round(getNutrientValue(NUTRIENT_CODES.FAT))} g
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingEntry ? 'Redigera registrering' : 'Lägg till livsmedel'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Food Search */}
              {!selectedFood ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sök livsmedel
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="T.ex. mjölk, äpple, bröd..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      autoFocus
                    />
                  </div>

                  {searching && <p className="text-gray-500">Söker...</p>}

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map((food) => (
                        <button
                          key={food.nummer}
                          onClick={() => setSelectedFood(food)}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <p className="font-medium">{food.namn}</p>
                          <p className="text-sm text-gray-600">#{food.nummer}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{selectedFood.namn}</p>
                        <p className="text-sm text-gray-600">#{selectedFood.nummer}</p>
                      </div>
                      {!editingEntry && (
                        <button
                          onClick={() => setSelectedFood(null)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Byt livsmedel
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Måltid
                    </label>
                    <select
                      className="input w-full"
                      value={selectedMealType}
                      onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                    >
                      {Object.entries(mealTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mängd (gram)
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                      min="1"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tid (valfritt)
                    </label>
                    <input
                      type="time"
                      className="input w-full"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kommentar (valfritt)
                    </label>
                    <textarea
                      className="input w-full"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="T.ex. hemlagat, storpack..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={handleAddEntry} className="btn btn-primary flex-1">
                      {editingEntry ? 'Spara ändringar' : 'Lägg till'}
                    </button>
                    <button onClick={resetForm} className="btn flex-1">
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
