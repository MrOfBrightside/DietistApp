import { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import { foodService } from '../services/foodService';
import { Recipe, CreateRecipeDto, RecipeItemDto, LivsmedelSearchResult, LivsmedelFoodItem } from '@dietistapp/shared';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recipeService.getRecipes();
      setRecipes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ladda recept');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setShowForm(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await recipeService.deleteRecipe(id);
      setRecipes(recipes.filter(r => r.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ta bort recept');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecipe(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRecipe(null);
    loadRecipes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Laddar recept...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mina recept</h1>
        <button onClick={handleCreateRecipe} className="btn btn-primary">
          Skapa nytt recept
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {recipes.length === 0 && !showForm ? (
        <div className="card">
          <p className="text-gray-500">Inga recept skapade än</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{recipe.name}</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditRecipe(recipe)}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    Redigera
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(recipe.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Ta bort
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Portioner:</span> {recipe.servings}
                </p>
                {recipe.description && (
                  <p className="text-gray-500">{recipe.description}</p>
                )}
                {recipe.items && recipe.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="font-medium text-gray-700 mb-1">Ingredienser:</p>
                    <ul className="space-y-1">
                      {recipe.items.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-600">
                          {item.foodNameSnapshot} ({item.grams}g)
                        </li>
                      ))}
                      {recipe.items.length > 3 && (
                        <li className="text-xs text-gray-500 italic">
                          +{recipe.items.length - 3} fler ingredienser
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {deleteConfirm === recipe.id && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800 mb-2">Är du säker?</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Ta bort
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

interface RecipeFormProps {
  recipe: Recipe | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RecipeForm({ recipe, onClose, onSuccess }: RecipeFormProps) {
  const [name, setName] = useState(recipe?.name || '');
  const [servings, setServings] = useState(recipe?.servings || 1);
  const [description, setDescription] = useState(recipe?.description || '');
  const [items, setItems] = useState<RecipeItemDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LivsmedelSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (recipe) {
      loadRecipeItems();
    }
  }, [recipe]);

  const loadRecipeItems = async () => {
    if (!recipe) return;

    try {
      const fullRecipe = await recipeService.getRecipeById(recipe.id);
      if (fullRecipe.items) {
        setItems(fullRecipe.items.map(item => ({
          foodNumber: item.foodNumber,
          foodNameSnapshot: item.foodNameSnapshot,
          grams: item.grams,
        })));
      }
    } catch (err) {
      console.error('Failed to load recipe items:', err);
    }
  };

  const handleSearchFood = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const results = await foodService.searchFoods(searchQuery, 10);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddIngredient = (food: LivsmedelFoodItem) => {
    const newItem: RecipeItemDto = {
      foodNumber: food.nummer,
      foodNameSnapshot: food.namn,
      grams: 100,
    };
    setItems([...items, newItem]);
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleRemoveIngredient = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateGrams = (index: number, grams: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], grams };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Receptnamn krävs');
      return;
    }

    if (servings < 1) {
      setError('Antal portioner måste vara minst 1');
      return;
    }

    if (items.length === 0) {
      setError('Minst en ingrediens krävs');
      return;
    }

    try {
      setSubmitting(true);
      const dto: CreateRecipeDto = {
        name,
        servings,
        description: description.trim() || undefined,
        items,
      };

      if (recipe) {
        await recipeService.updateRecipe(recipe.id, dto);
      } else {
        await recipeService.createRecipe(dto);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte spara recept');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {recipe ? 'Redigera recept' : 'Skapa nytt recept'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receptnamn
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                placeholder="T.ex. Pannkakor"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Antal portioner
              </label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className="input w-full"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivning (valfritt)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Beskrivning av receptet..."
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredienser
              </label>

              <div className="space-y-3 mb-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.foodNameSnapshot}</p>
                    </div>
                    <input
                      type="number"
                      value={item.grams}
                      onChange={(e) => handleUpdateGrams(index, parseFloat(e.target.value) || 0)}
                      className="input w-24"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-600">g</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchFood())}
                    className="input flex-1"
                    placeholder="Sök livsmedel..."
                  />
                  <button
                    type="button"
                    onClick={handleSearchFood}
                    disabled={searching || !searchQuery.trim()}
                    className="btn btn-secondary"
                  >
                    {searching ? 'Söker...' : 'Sök'}
                  </button>
                </div>

                {searchResults && searchResults.items.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.items.map((food, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleAddIngredient(food)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-900">{food.namn}</p>
                        <p className="text-xs text-gray-500">Nr: {food.nummer}</p>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults && searchResults.items.length === 0 && (
                  <p className="text-sm text-gray-500">Inga resultat hittades</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? 'Sparar...' : recipe ? 'Uppdatera recept' : 'Skapa recept'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
