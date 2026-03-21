import { define } from "../../utils.ts";
import { Head } from "fresh/runtime";
import type { Recipe } from "@reelcipe/shared";
import RecipeCard from "../../components/recipe-card.tsx";

interface Data {
  recipes?: Recipe[];
  error?: string;
}

export const handler = define.handlers({
  GET: async (ctx) => {
    try {
      const sessionToken = ctx.state.sessionToken;
      const recipes = await fetch(`http://backend:8000/api/recipes`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch recipes");
        return res.json();
      });
      return { data: { recipes } };
    } catch (error) {
      console.error(error);
      return { data: { error: "Failed to load recipes. Please try again." } };
    }
  },
});

export default define.page(function DashboardPage({ data }) {
  const recipes = data?.recipes ?? [];
  const error = data?.error;

  return (
    <div class="min-h-screen bg-base-200">
      <Head>
        <title>My Recipes - reelcipe</title>
      </Head>

      <div class="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-bold text-base-content">My Recipes</h1>
            <p class="text-base-content/70 mt-1">
              {recipes.length > 0
                ? `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} in your collection`
                : "Your recipe collection is empty"}
            </p>
          </div>
          <a href="/generate" class="btn btn-primary gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Recipe
          </a>
        </div>

        {/* Error Alert */}
        {error && (
          <div class="alert alert-error mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Recipe Grid */}
        {recipes.length > 0 ? (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        ) : !error ? (
          /* Empty State */
          <div class="card bg-base-100 shadow-sm max-w-lg mx-auto">
            <div class="card-body items-center text-center py-12">
              <div class="p-4 bg-base-200 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 class="card-title text-xl mb-2">No Recipes Yet</h2>
              <p class="text-base-content/70 mb-6 max-w-sm">
                Start building your collection by generating a recipe from any URL or adding one manually.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <a href="/generate" class="btn btn-primary">
                  Generate Recipe
                </a>
                <a href="/" class="btn btn-outline">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});
