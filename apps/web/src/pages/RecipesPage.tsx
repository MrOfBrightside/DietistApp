import { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import { foodService } from '../services/foodService';
import { Recipe, RecipeItemDto } from '@dietistapp/shared';

interface RecipeWithItems extends Recipe {
  items: Array<{
    id: string;
    foodNumber: string;
    foodNameSnapshot: string;
    grams: number;
  }>;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithItems | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<RecipeWithItems | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [servings, setServings] = useState('2');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<RecipeItemDto[]>([]);

  // Food search state
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = await recipeService.getRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      alert('Kunde inte ladda recept');
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

  const handleAddIngredient = (food: any) => {
    const newItem: RecipeItemDto = {
      foodNumber: food.nummer,
      foodNameSnapshot: food.namn,
      grams: 100,
    };
    setItems([...items, newItem]);
    setShowFoodSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveIngredient = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateIngredientGrams = (index: number, grams: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], grams };
    setItems(updated);
  };

  const handleSaveRecipe = async () => {
    if (!name.trim()) {
      alert('Receptnamn krävs');
      return;
    }

    if (items.length === 0) {
      alert('Minst en ingrediens krävs');
      return;
    }

    const servingsNum = parseInt(servings);
    if (isNaN(servingsNum) || servingsNum <= 0) {
      alert('Antal portioner måste vara ett positivt heltal');
      return;
    }

    try {
      const dto = {
        name: name.trim(),
        servings: servingsNum,
        description: description.trim() || undefined,
        items,
      };

      if (editingRecipe) {
        await recipeService.updateRecipe(editingRecipe.id, dto);
      } else {
        await recipeService.createRecipe(dto);
      }

      resetForm();
      loadRecipes();
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('Kunde inte spara receptet');
    }
  };

  const handleEditRecipe = (recipe: RecipeWithItems) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setServings(recipe.servings.toString());
    setDescription(recipe.description || '');
    setItems(
      recipe.items.map((item) => ({
        foodNumber: item.foodNumber,
        foodNameSnapshot: item.foodNameSnapshot,
        grams: item.grams,
      }))
    );
    setShowModal(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta recept?')) return;

    try {
      await recipeService.deleteRecipe(recipeId);
      loadRecipes();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      alert('Kunde inte ta bort receptet');
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingRecipe(null);
    setName('');
    setServings('2');
    setDescription('');
    setItems([]);
    setShowFoodSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const openCreateModal = () => {
    setShowModal(true);
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
        <h1 className="text-3xl font-bold text-gray-900">Mina recept</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          Skapa nytt recept
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-center py-8">
            Inga recept skapade än. Klicka på "Skapa nytt recept" för att komma igång!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{recipe.name}</h3>
                <span className="text-sm text-gray-500">{recipe.servings} port.</span>
              </div>

              {recipe.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
              )}

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Ingredienser:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.items.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      • {item.foodNameSnapshot} ({item.grams}g)
                    </li>
                  ))}
                  {recipe.items.length > 3 && (
                    <li className="text-gray-500 italic">+ {recipe.items.length - 3} till...</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewingRecipe(recipe)}
                  className="btn flex-1"
                >
                  Visa
                </button>
                <button
                  onClick={() => handleEditRecipe(recipe)}
                  className="text-blue-600 hover:text-blue-800 px-3"
                >
                  Redigera
                </button>
                <button
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  className="text-red-600 hover:text-red-800 px-3"
                >
                  Ta bort
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingRecipe ? 'Redigera recept' : 'Skapa nytt recept'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receptnamn *
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="T.ex. Grön smoothie"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antal portioner *
                  </label>
                  <input
                    type="number"
                    className="input w-full"
                    min="1"
                    step="1"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivning (valfritt)
                  </label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    placeholder="Beskriv ditt recept..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ingredienser * (minst 1)
                    </label>
                    <button
                      onClick={() => setShowFoodSearch(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Lägg till ingrediens
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                      Inga ingredienser ännu
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.foodNameSnapshot}</p>
                            <p className="text-xs text-gray-600">#{item.foodNumber}</p>
                          </div>
                          <input
                            type="number"
                            className="input w-24 text-sm"
                            value={item.grams}
                            onChange={(e) =>
                              handleUpdateIngredientGrams(index, parseFloat(e.target.value))
                            }
                            min="1"
                            step="1"
                          />
                          <span className="text-sm text-gray-600">g</span>
                          <button
                            onClick={() => handleRemoveIngredient(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Ta bort
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={handleSaveRecipe} className="btn btn-primary flex-1">
                    {editingRecipe ? 'Spara ändringar' : 'Skapa recept'}
                  </button>
                  <button onClick={resetForm} className="btn flex-1">
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Food Search Modal (nested) */}
      {showFoodSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Sök ingrediens</h3>
                <button
                  onClick={() => {
                    setShowFoodSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Sök livsmedel..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  autoFocus
                />

                {searching && <p className="text-gray-500">Söker...</p>}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((food) => (
                      <button
                        key={food.nummer}
                        onClick={() => handleAddIngredient(food)}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <p className="font-medium">{food.namn}</p>
                        <p className="text-sm text-gray-600">#{food.nummer}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Recipe Modal */}
      {viewingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{viewingRecipe.name}</h2>
                <button
                  onClick={() => setViewingRecipe(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{viewingRecipe.servings} portioner</span>
                  <span>•</span>
                  <span>{viewingRecipe.items.length} ingredienser</span>
                </div>

                {viewingRecipe.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Beskrivning</h3>
                    <p className="text-gray-700">{viewingRecipe.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Ingredienser</h3>
                  <div className="space-y-2">
                    {viewingRecipe.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.foodNameSnapshot}</p>
                          <p className="text-sm text-gray-600">#{item.foodNumber}</p>
                        </div>
                        <p className="text-sm font-medium">{item.grams}g</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setViewingRecipe(null);
                      handleEditRecipe(viewingRecipe);
                    }}
                    className="btn btn-primary flex-1"
                  >
                    Redigera
                  </button>
                  <button onClick={() => setViewingRecipe(null)} className="btn flex-1">
                    Stäng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
