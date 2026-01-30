import { useState, useEffect, useRef } from 'react';
import { recipeService } from '../services/recipeService';
import { foodService } from '../services/foodService';
import {
  Recipe,
  CreateRecipeDto,
  RecipeItemDto,
  LivsmedelFoodItem,
  NutritionSummary,
  calculateNutrientIntake,
  sumNutrients,
  NUTRIENT_CODES
} from '@dietistapp/shared';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

interface ExtendedRecipe extends Recipe {
  items?: Array<{
    id: string;
    foodNumber: string;
    foodNameSnapshot: string;
    grams: number;
  }>;
  nutrition?: NutritionSummary;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<ExtendedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ExtendedRecipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<ExtendedRecipe | null>(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<NutritionSummary | null>(null);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);
  const [recipeNutritionCache, setRecipeNutritionCache] = useState<Map<string, NutritionSummary>>(new Map());
  const [loadingNutritionIds, setLoadingNutritionIds] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState<CreateRecipeDto>({
    name: '',
    servings: 1,
    description: '',
    items: [],
  });

  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState<RecipeItemDto>({
    foodNumber: '',
    foodNameSnapshot: '',
    grams: 100,
  });

  // Food search state
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState<LivsmedelFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced food search
  const handleFoodSearch = (query: string) => {
    setFoodSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setFoodSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await foodService.searchFoods(query, 10);
        setFoodSearchResults(result.items);
        setShowSearchDropdown(true);
      } catch (err: any) {
        console.error('Food search error:', err);
        setFoodSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle food selection from search results
  const handleFoodSelect = (food: LivsmedelFoodItem) => {
    setNewIngredient({
      ...newIngredient,
      foodNumber: food.nummer,
      foodNameSnapshot: food.namn,
    });
    setFoodSearchQuery(food.namn);
    setShowSearchDropdown(false);
    setFoodSearchResults([]);
  };

  // Calculate nutrition for viewing in modal
  const calculateRecipeNutrition = async (recipe: ExtendedRecipe) => {
    if (!recipe.items || recipe.items.length === 0) {
      return null;
    }

    setCalculatingNutrition(true);
    try {
      const nutrition = await calculateNutritionForRecipe(recipe);
      setRecipeNutrition(nutrition);
      return nutrition;
    } catch (err: any) {
      console.error('Nutrition calculation error:', err);
      setError('Kunde inte beräkna näringsvärden');
      return null;
    } finally {
      setCalculatingNutrition(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await recipeService.getRecipes();
      setRecipes(data);
      setError(null);
      // Load nutrition for cards in background
      loadRecipeCardsNutrition(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ladda recept');
    } finally {
      setLoading(false);
    }
  };

  // Load nutrition for recipe cards
  const loadRecipeCardsNutrition = async (recipesToLoad: ExtendedRecipe[]) => {
    for (const recipe of recipesToLoad) {
      if (!recipe.id || recipeNutritionCache.has(recipe.id)) continue;

      setLoadingNutritionIds(prev => new Set(prev).add(recipe.id));

      try {
        const fullRecipe = await recipeService.getRecipeById(recipe.id);
        if (fullRecipe.items && fullRecipe.items.length > 0) {
          const nutrition = await calculateNutritionForRecipe(fullRecipe as ExtendedRecipe);
          if (nutrition) {
            setRecipeNutritionCache(prev => new Map(prev).set(recipe.id, nutrition));
          }
        }
      } catch (err) {
        console.error(`Failed to load nutrition for recipe ${recipe.id}:`, err);
      } finally {
        setLoadingNutritionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
      }
    }
  };

  // Calculate nutrition without setting modal state
  const calculateNutritionForRecipe = async (recipe: ExtendedRecipe): Promise<NutritionSummary | null> => {
    if (!recipe.items || recipe.items.length === 0) {
      return null;
    }

    try {
      const itemNutrients = [];
      let totalGrams = 0;

      for (const item of recipe.items) {
        const nutrientData = await foodService.getNutrientsByFoodNumber(item.foodNumber);
        const nutrients = calculateNutrientIntake(item.grams, nutrientData.naeringsvaerden);
        itemNutrients.push(nutrients);
        totalGrams += item.grams;
      }

      const totalNutrients = sumNutrients(itemNutrients);

      return {
        nutrients: totalNutrients,
        totalGrams,
        calculatedAt: new Date(),
      };
    } catch (err: any) {
      console.error('Nutrition calculation error:', err);
      return null;
    }
  };

  const handleCreateRecipe = () => {
    setSelectedRecipe(null);
    setFormData({
      name: '',
      servings: 1,
      description: '',
      items: [],
    });
    setNewIngredient({
      foodNumber: '',
      foodNameSnapshot: '',
      grams: 100,
    });
    setFoodSearchQuery('');
    setFoodSearchResults([]);
    setShowSearchDropdown(false);
    setShowModal(true);
  };

  const handleEditRecipe = async (recipe: ExtendedRecipe) => {
    try {
      const fullRecipe = await recipeService.getRecipeById(recipe.id);
      setSelectedRecipe(fullRecipe as ExtendedRecipe);
      setFormData({
        name: fullRecipe.name,
        servings: fullRecipe.servings,
        description: fullRecipe.description || '',
        items: (fullRecipe as ExtendedRecipe).items?.map(item => ({
          foodNumber: item.foodNumber,
          foodNameSnapshot: item.foodNameSnapshot,
          grams: item.grams,
        })) || [],
      });
      setNewIngredient({
        foodNumber: '',
        foodNameSnapshot: '',
        grams: 100,
      });
      setFoodSearchQuery('');
      setFoodSearchResults([]);
      setShowSearchDropdown(false);
      setShowModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ladda recept');
    }
  };

  const handleViewRecipe = async (recipe: ExtendedRecipe) => {
    try {
      const fullRecipe = await recipeService.getRecipeById(recipe.id);
      setViewingRecipe(fullRecipe as ExtendedRecipe);
      await calculateRecipeNutrition(fullRecipe as ExtendedRecipe);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ladda recept');
    }
  };

  const handleDeleteRecipe = (id: string) => {
    setDeleteRecipeId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteRecipeId) return;

    try {
      await recipeService.deleteRecipe(deleteRecipeId);
      await loadRecipes();
      setShowDeleteConfirm(false);
      setDeleteRecipeId(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ta bort recept');
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredient.foodNumber || !newIngredient.foodNameSnapshot || newIngredient.grams <= 0) {
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { ...newIngredient }],
    });

    setNewIngredient({
      foodNumber: '',
      foodNameSnapshot: '',
      grams: 100,
    });
    setFoodSearchQuery('');
    setFoodSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.servings <= 0 || formData.items.length === 0) {
      setError('Fyll i alla obligatoriska fält och lägg till minst en ingrediens');
      return;
    }

    try {
      if (selectedRecipe) {
        await recipeService.updateRecipe(selectedRecipe.id, formData);
      } else {
        await recipeService.createRecipe(formData);
      }

      await loadRecipes();
      setShowModal(false);
      setSelectedRecipe(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte spara recept');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Mina recept</h1>
        <LoadingSpinner size="lg" text="Laddar recept..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mina recept</h1>
        <button className="btn btn-primary" onClick={handleCreateRecipe}>
          Skapa nytt recept
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadRecipes} />}

      {recipes.length === 0 ? (
        <div className="card">
          <p className="text-gray-500">Inga recept skapade än</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => {
            const nutrition = recipeNutritionCache.get(recipe.id);
            const isLoadingNutrition = loadingNutritionIds.has(recipe.id);

            return (
              <div key={recipe.id} className="card hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{recipe.name}</h3>
                <p className="text-gray-600 mb-2">Portioner: {recipe.servings}</p>
                {recipe.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {/* Nutrition Preview */}
                {isLoadingNutrition ? (
                  <div className="bg-gray-50 p-3 rounded mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Laddar näring...</span>
                  </div>
                ) : nutrition ? (
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <div className="text-xs text-gray-600 mb-2 font-medium">Per portion:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(() => {
                        const energy = nutrition.nutrients.find(n => n.code === NUTRIENT_CODES.ENERGY);
                        const protein = nutrition.nutrients.find(n => n.code === NUTRIENT_CODES.PROTEIN);
                        const carbs = nutrition.nutrients.find(n => n.code === NUTRIENT_CODES.CARBOHYDRATE);
                        const fat = nutrition.nutrients.find(n => n.code === NUTRIENT_CODES.FAT);

                        const perServing = (value: number | null) =>
                          value !== null ? Math.round((value / recipe.servings) * 10) / 10 : null;

                        return (
                          <>
                            {energy && (
                              <div>
                                <span className="text-gray-600">Energi: </span>
                                <span className="font-semibold">
                                  {perServing(energy.value)} {energy.unit}
                                </span>
                              </div>
                            )}
                            {protein && (
                              <div>
                                <span className="text-gray-600">Protein: </span>
                                <span className="font-semibold">
                                  {perServing(protein.value)} {protein.unit}
                                </span>
                              </div>
                            )}
                            {carbs && (
                              <div>
                                <span className="text-gray-600">Kolhydr: </span>
                                <span className="font-semibold">
                                  {perServing(carbs.value)} {carbs.unit}
                                </span>
                              </div>
                            )}
                            {fat && (
                              <div>
                                <span className="text-gray-600">Fett: </span>
                                <span className="font-semibold">
                                  {perServing(fat.value)} {fat.unit}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2 mt-4">
                  <button
                    className="btn btn-primary flex-1"
                    onClick={() => handleViewRecipe(recipe)}
                  >
                    Visa
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEditRecipe(recipe)}
                  >
                    Redigera
                  </button>
                  <button
                    className="btn bg-red-600 text-white hover:bg-red-700"
                    onClick={() => handleDeleteRecipe(recipe.id)}
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedRecipe ? 'Redigera recept' : 'Skapa nytt recept'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Receptnamn *
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Antal portioner *
                  </label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Beskrivning
                  </label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ingredienser * (minst 1 krävs)
                  </label>

                  {formData.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <span className="flex-1">
                            {item.foodNameSnapshot} ({item.foodNumber}) - {item.grams}g
                          </span>
                          <button
                            type="button"
                            className="btn bg-red-600 text-white hover:bg-red-700 px-2 py-1 text-sm"
                            onClick={() => handleRemoveIngredient(index)}
                          >
                            Ta bort
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium">Lägg till ingrediens</h3>

                    {/* Food Search with Autocomplete */}
                    <div className="relative" ref={searchDropdownRef}>
                      <label className="block text-sm mb-1">Sök livsmedel *</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={foodSearchQuery}
                        onChange={(e) => handleFoodSearch(e.target.value)}
                        placeholder="Skriv minst 2 tecken för att söka..."
                        autoComplete="off"
                      />

                      {isSearching && (
                        <div className="absolute right-3 top-9">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                      )}

                      {showSearchDropdown && foodSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {foodSearchResults.map((food) => (
                            <button
                              key={food.nummer}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                              onClick={() => handleFoodSelect(food)}
                            >
                              <div className="font-medium text-gray-900">{food.namn}</div>
                              <div className="text-sm text-gray-600">
                                Nr: {food.nummer}
                                {food.latin && ` • ${food.latin}`}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {showSearchDropdown && foodSearchResults.length === 0 && !isSearching && foodSearchQuery.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          Inga livsmedel hittades
                        </div>
                      )}
                    </div>

                    {/* Display selected food */}
                    {newIngredient.foodNumber && newIngredient.foodNameSnapshot && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="text-sm font-medium text-blue-900">Valt livsmedel:</div>
                        <div className="text-sm text-blue-800">
                          {newIngredient.foodNameSnapshot} (Nr: {newIngredient.foodNumber})
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm mb-1">Gram *</label>
                      <input
                        type="number"
                        className="input w-full"
                        value={newIngredient.grams}
                        onChange={(e) => setNewIngredient({ ...newIngredient, grams: parseFloat(e.target.value) })}
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      onClick={handleAddIngredient}
                      disabled={!newIngredient.foodNumber || !newIngredient.foodNameSnapshot || newIngredient.grams <= 0}
                    >
                      Lägg till ingrediens
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {selectedRecipe ? 'Spara ändringar' : 'Skapa recept'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRecipe(null);
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Recipe Modal */}
      {viewingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{viewingRecipe.name}</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">
                    <strong>Portioner:</strong> {viewingRecipe.servings}
                  </p>
                </div>

                {viewingRecipe.description && (
                  <div>
                    <p className="text-gray-600">
                      <strong>Beskrivning:</strong>
                    </p>
                    <p className="text-gray-700 mt-1">{viewingRecipe.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-2">Ingredienser</h3>
                  {viewingRecipe.items && viewingRecipe.items.length > 0 ? (
                    <div className="space-y-2">
                      {viewingRecipe.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium">{item.foodNameSnapshot}</p>
                          <p className="text-sm text-gray-600">
                            Livsmedelsnummer: {item.foodNumber} | Mängd: {item.grams}g
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Inga ingredienser</p>
                  )}
                </div>

                {/* Nutrition Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Näringsvärden</h3>
                  {calculatingNutrition ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span>Beräknar näringsvärden...</span>
                    </div>
                  ) : recipeNutrition ? (
                    <div className="space-y-4">
                      {/* Per Portion */}
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <div className="text-sm font-semibold text-blue-900 mb-3">
                          Per portion (1 av {viewingRecipe.servings})
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(() => {
                            const getMainNutrients = () => {
                              const nutrients = recipeNutrition.nutrients;
                              return [
                                { label: 'Energi', code: NUTRIENT_CODES.ENERGY },
                                { label: 'Protein', code: NUTRIENT_CODES.PROTEIN },
                                { label: 'Kolhydrater', code: NUTRIENT_CODES.CARBOHYDRATE },
                                { label: 'Fett', code: NUTRIENT_CODES.FAT },
                                { label: 'Fiber', code: NUTRIENT_CODES.FIBER },
                              ].map(({ label, code }) => {
                                const nutrient = nutrients.find(n => n.code === code);
                                return { label, nutrient };
                              }).filter(({ nutrient }) => nutrient !== undefined);
                            };

                            const perServing = (value: number | null) =>
                              value !== null ? Math.round((value / viewingRecipe.servings) * 10) / 10 : null;

                            return getMainNutrients().map(({ label, nutrient }) => (
                              <div key={nutrient!.code} className="bg-white p-3 rounded border border-blue-100">
                                <div className="text-xs text-gray-600 mb-1">{label}</div>
                                <div className="font-bold text-gray-900">
                                  {nutrient!.value !== null
                                    ? `${perServing(nutrient!.value)} ${nutrient!.unit}`
                                    : 'N/A'}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Total Recipe */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-3">
                          Totalt hela receptet ({viewingRecipe.servings} {viewingRecipe.servings === 1 ? 'portion' : 'portioner'})
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(() => {
                            const getMainNutrients = () => {
                              const nutrients = recipeNutrition.nutrients;
                              return [
                                { label: 'Energi', code: NUTRIENT_CODES.ENERGY },
                                { label: 'Protein', code: NUTRIENT_CODES.PROTEIN },
                                { label: 'Kolhydrater', code: NUTRIENT_CODES.CARBOHYDRATE },
                                { label: 'Fett', code: NUTRIENT_CODES.FAT },
                                { label: 'Fiber', code: NUTRIENT_CODES.FIBER },
                              ].map(({ label, code }) => {
                                const nutrient = nutrients.find(n => n.code === code);
                                return { label, nutrient };
                              }).filter(({ nutrient }) => nutrient !== undefined);
                            };

                            return getMainNutrients().map(({ label, nutrient }) => (
                              <div key={nutrient!.code} className="bg-white p-3 rounded border border-gray-200">
                                <div className="text-xs text-gray-600 mb-1">{label}</div>
                                <div className="font-semibold text-gray-900">
                                  {nutrient!.value !== null
                                    ? `${Math.round(nutrient!.value * 10) / 10} ${nutrient!.unit}`
                                    : 'N/A'}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Kunde inte beräkna näringsvärden</p>
                  )}
                </div>

                <div className="text-sm text-gray-500 pt-4 border-t">
                  <p>Skapad: {new Date(viewingRecipe.createdAt).toLocaleDateString('sv-SE')}</p>
                  <p>Uppdaterad: {new Date(viewingRecipe.updatedAt).toLocaleDateString('sv-SE')}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    setViewingRecipe(null);
                    setRecipeNutrition(null);
                    handleEditRecipe(viewingRecipe);
                  }}
                >
                  Redigera
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setViewingRecipe(null);
                    setRecipeNutrition(null);
                  }}
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Bekräfta borttagning</h2>
            <p className="text-gray-700 mb-6">
              Är du säker på att du vill ta bort detta recept? Detta går inte att ångra.
            </p>
            <div className="flex gap-2">
              <button
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
                onClick={confirmDelete}
              >
                Ta bort
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteRecipeId(null);
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
