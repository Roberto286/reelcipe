import { define } from "../../utils.ts";
import { Head } from "fresh/runtime";
import { useEffect, useState } from "preact/hooks";
import { getRecipe, type Recipe } from "@reelcipe/shared";

interface Data {
  recipe?: Recipe;
  error?: string;
  isEditing?: boolean;
}

export const handler = define.handlers(async (ctx) => {
  const recipeId = ctx.params.id;
  const sessionToken = ctx.state.session?.token;
  const recipe = await getRecipe(recipeId, sessionToken);
  if (!recipe) {
    return {
      data: {
        recipe: undefined,
        error: "Recipe not found",
        isEditing: false,
        url: ctx.req.url,
      },
    };
  }
  const url = new URL(ctx.req.url);
  const isEditing = url.searchParams.get("mode") === "edit";
  return { data: { recipe, error: undefined, isEditing, url: ctx.req.url } };
});

export default define.page<typeof handler>(
  function RecipeDetail({ data }) {
    const { recipe: initialRecipe, error: initialError, isEditing } = data;
    const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe || null);
    const [error, setError] = useState<string | null>(initialError || null);

    // Form state for editing
    const [editForm, setEditForm] = useState({
      title: recipe?.title || "",
      description: "", // Not in current data, placeholder
      ingredients: recipe?.ingredients.map((ing) =>
        `${ing.quantity} ${ing.unit} ${ing.name}`
      ).join("\n") || "",
      instructions: recipe?.method.map((step) =>
        step.text
      ).join("\n\n") || "",
      prepTime: recipe?.prepTime || 0,
      cookTime: recipe?.cookTime || 0,
      servings: recipe?.defaultServes || 1,
      difficulty: recipe?.difficulty || "Medium" as const,
    });

    // Update form when recipe loads
    useEffect(() => {
      if (recipe) {
        setEditForm({
          title: recipe.title,
          description: "",
          ingredients: recipe.ingredients.map((ing) =>
            `${ing.quantity} ${ing.unit} ${ing.name}`
          ).join("\n"),
          instructions: recipe.method.map((step) => step.text).join("\n\n"),
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          servings: recipe.defaultServes,
          difficulty: recipe.difficulty || "Medium",
        });
      }
    }, [recipe]);

    if (error && !recipe) {
      return (
        <div class="min-h-screen bg-base-200 flex items-center justify-center">
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      );
    }

    if (!recipe) {
      return (
        <div class="min-h-screen bg-base-200 flex items-center justify-center">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      );
    }

    return (
      <div class="min-h-screen bg-base-200">
        <Head>
          <title>{recipe.title} - reelcipe</title>
        </Head>

        <div class="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav class="mb-6">
            <div class="text-sm breadcrumbs">
              <ul>
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/recipes">Recipes</a>
                </li>
                <li>{recipe.title}</li>
              </ul>
            </div>
          </nav>

          {/* Main Card */}
          <div class="card bg-base-100 shadow-xl">
            <figure class="aspect-video">
              <img
                src={`/api/image-proxy?url=${
                  encodeURIComponent(recipe.imageUrl)
                }`}
                alt={recipe.title}
                class="w-full h-full object-cover"
              />
            </figure>

            <div class="card-body">
              {/* Header */}
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h1 class="card-title text-3xl mb-2">{recipe.title}</h1>
                  <div class="flex items-center gap-4 text-sm text-base-content/70">
                    <span>⭐ {recipe.rating}/5</span>
                    <span>👥 {recipe.defaultServes} servings</span>
                    {recipe.prepTime && (
                      <span>⏱️ Prep: {recipe.prepTime}min</span>
                    )}
                    {recipe.cookTime && (
                      <span>🍳 Cook: {recipe.cookTime}min</span>
                    )}
                    {recipe.difficulty && <span>📊 {recipe.difficulty}</span>}
                  </div>
                </div>
                <a
                  href={isEditing
                    ? data.url?.replace("?mode=edit", "")
                    : `?mode=edit`}
                  class="btn btn-primary"
                >
                  {isEditing ? "Cancel Edit" : "Edit"}
                </a>
              </div>

              {/* Tags */}
              <div class="flex flex-wrap gap-2 mb-6">
                {recipe.tags.map((tag) => (
                  <div key={tag.id} class="badge badge-outline">{tag.name}</div>
                ))}
              </div>

              {/* Content */}
              <div class="space-y-6">
                {/* Ingredients */}
                <div>
                  <h2 class="text-xl font-semibold mb-3">Ingredients</h2>
                  <ul class="list-disc list-inside space-y-1">
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id}>
                        {ingredient.quantity} {ingredient.unit}{" "}
                        {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h2 class="text-xl font-semibold mb-3">Instructions</h2>
                  <ol class="list-decimal list-inside space-y-3">
                    {recipe.method.map((step) => (
                      <li key={step.id} class="text-base-content/80">
                        {step.text}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Additional Info */}
                <div class="text-sm text-base-content/60">
                  <p>Downloaded from: {recipe.downloadedFrom}</p>
                  <p>
                    Created: {new Date(recipe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
