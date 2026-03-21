import { define } from "../../utils.ts";
import { Head } from "fresh/runtime";
import { useEffect, useState } from "preact/hooks";
import type { Recipe } from "@reelcipe/shared";

const BACKEND_URL = "http://backend:8000";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

interface Data {
  recipe?: Recipe;
  error?: string;
  isEditing?: boolean;
  url: string;
}

function formatRating(rating: number): string {
  return rating > 0 ? `${rating}/5` : "Not rated";
}

function getRatingClass(rating: number): string {
  if (rating === 0) return "badge-ghost";
  if (rating >= 4) return "badge-success";
  if (rating >= 3) return "badge-warning";
  return "badge-error";
}

function printRecipe(): void {
  window.print();
}

export const handler = define.handlers(async (ctx) => {
  const recipeId = ctx.params.id;
  const sessionToken = ctx.state.sessionToken;
  try {
    const response = await fetch(`${BACKEND_URL}/api/recipes/${recipeId}`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    if (!response.ok) {
      return {
        data: {
          recipe: undefined,
          error: "Recipe not found",
          isEditing: false,
          url: ctx.req.url,
        },
      };
    }
    const recipe = await response.json();
    const url = new URL(ctx.req.url);
    const isEditing = url.searchParams.get("mode") === "edit";
    return { data: { recipe, error: undefined, isEditing, url: ctx.req.url } };
  } catch (error) {
    console.error(error);
    return {
      data: {
        recipe: undefined,
        error: "Failed to fetch recipe",
        isEditing: false,
        url: ctx.req.url,
      },
    };
  }
});

export default define.page<typeof handler>(
  function RecipeDetail({ data }) {
    const { recipe: initialRecipe, error: initialError, isEditing } = data;
    const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe || null);
    const [error, setError] = useState<string | null>(initialError || null);

    // Form state for editing
    const [editForm, setEditForm] = useState({
      title: recipe?.title || "",
      description: "",
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
          <div class="card bg-base-100 shadow-lg max-w-md">
            <div class="card-body items-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-error mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 class="card-title text-xl">Recipe Not Found</h2>
              <p class="text-base-content/70 mb-4">{error}</p>
              <a href="/recipes" class="btn btn-primary">Back to Recipes</a>
            </div>
          </div>
        </div>
      );
    }

    if (!recipe) {
      return (
        <div class="min-h-screen bg-base-200 flex items-center justify-center">
          <div class="text-center">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="mt-4 text-base-content/70">Loading recipe...</p>
          </div>
        </div>
      );
    }

    return (
      <div class="min-h-screen bg-base-200 print:bg-white">
        <Head>
          <title>{recipe.title} - reelcipe</title>
        </Head>

        <div class="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav class="mb-6 print:hidden">
            <div class="text-sm breadcrumbs">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/recipes">Recipes</a></li>
                <li class="line-clamp-1">{recipe.title}</li>
              </ul>
            </div>
          </nav>

          {/* Main Card */}
          <article class="card bg-base-100 shadow-xl print:shadow-none">
            <figure class="aspect-video bg-base-200">
              <img
                src={`/api/image-proxy?url=${encodeURIComponent(recipe.imageUrl)}`}
                alt={recipe.title}
                class="w-full h-full object-cover"
              />
            </figure>

            <div class="card-body">
              {/* Header */}
              <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div>
                  <h1 class="card-title text-2xl sm:text-3xl mb-2">{recipe.title}</h1>
                  <div class="flex flex-wrap items-center gap-3 text-sm text-base-content/70">
                    <span class={`badge ${getRatingClass(recipe.rating)}`}>
                      {formatRating(recipe.rating)}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {recipe.defaultServes} servings
                    </span>
                    {recipe.prepTime && (
                      <span class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Prep: {recipe.prepTime}min
                      </span>
                    )}
                    {recipe.cookTime && (
                      <span class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        Cook: {recipe.cookTime}min
                      </span>
                    )}
                    {recipe.difficulty && (
                      <span class="badge badge-outline">{recipe.difficulty}</span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div class="flex gap-2 print:hidden">
                  <button type="button" onClick={printRecipe} class="btn btn-ghost btn-sm gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                  <a
                    href={isEditing
                      ? data.url?.replace("?mode=edit", "")
                      : `?mode=edit`}
                    class="btn btn-primary btn-sm gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {isEditing ? "Cancel" : "Edit"}
                  </a>
                </div>
              </div>

              {/* Tags */}
              {recipe.tags.length > 0 && (
                <div class="flex flex-wrap gap-2 mb-6">
                  {recipe.tags.map((tag) => (
                    <span key={tag.id} class="badge badge-outline">{tag.name}</span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div class="space-y-8">
                {/* Ingredients */}
                <section>
                  <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Ingredients
                  </h2>
                  <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id} class="flex items-baseline gap-2">
                        <span class="text-primary font-medium min-w-[60px]">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        <span>{ingredient.name}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Instructions */}
                <section>
                  <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Instructions
                  </h2>
                  <ol class="space-y-4">
                    {recipe.method.map((step) => (
                      <li key={step.id} class="flex gap-4">
                        <span class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                          {step.stepNumber}
                        </span>
                        <p class="text-base-content/80 pt-1">{step.text}</p>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Source Info - Hidden on print */}
                <footer class="text-sm text-base-content/60 pt-4 border-t print:hidden">
                  <p>
                    Downloaded from:{" "}
                    {isValidHttpUrl(recipe.downloadedFrom) ? (
                      <a href={recipe.downloadedFrom} target="_blank" rel="noopener" class="link link-primary">
                        {recipe.downloadedFrom}
                      </a>
                    ) : (
                      <span class="text-base-content/50">{recipe.downloadedFrom}</span>
                    )}
                  </p>
                  <p>
                    Saved on: {new Date(recipe.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </footer>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  },
);
