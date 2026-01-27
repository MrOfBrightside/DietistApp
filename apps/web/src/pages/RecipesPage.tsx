export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mina recept</h1>
        <button className="btn btn-primary">Skapa nytt recept</button>
      </div>

      <div className="card">
        <p className="text-gray-500">Inga recept skapade än</p>
      </div>
    </div>
  );
}
