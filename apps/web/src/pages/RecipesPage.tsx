import { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import { Recipe, CreateRecipeDto, RecipeItemDto } from '@dietistapp/shared';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

interface ExtendedRecipe extends Recipe {
  items?: Array<{
    id: string;
    foodNumber: string;
    foodNameSnapshot: string;
    grams: number;
  }>;
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

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await recipeService.getRecipes();
      setRecipes(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ladda recept');
    } finally {
      setLoading(false);
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
      setShowModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunde inte ladda recept');
    }
  };

  const handleViewRecipe = async (recipe: ExtendedRecipe) => {
    try {
      const fullRecipe = await recipeService.getRecipeById(recipe.id);
      setViewingRecipe(fullRecipe as ExtendedRecipe);
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
          {recipes.map((recipe) => (
            <div key={recipe.id} className="card hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2">{recipe.name}</h3>
              <p className="text-gray-600 mb-2">Portioner: {recipe.servings}</p>
              {recipe.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {recipe.description}
                </p>
              )}
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
          ))}
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm mb-1">Livsmedelsnummer</label>
                        <input
                          type="text"
                          className="input w-full"
                          value={newIngredient.foodNumber}
                          onChange={(e) => setNewIngredient({ ...newIngredient, foodNumber: e.target.value })}
                          placeholder="t.ex. 1234"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Livsmedelsnamn</label>
                        <input
                          type="text"
                          className="input w-full"
                          value={newIngredient.foodNameSnapshot}
                          onChange={(e) => setNewIngredient({ ...newIngredient, foodNameSnapshot: e.target.value })}
                          placeholder="t.ex. Mjölk"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Gram</label>
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
                    handleEditRecipe(viewingRecipe);
                  }}
                >
                  Redigera
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setViewingRecipe(null)}
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
