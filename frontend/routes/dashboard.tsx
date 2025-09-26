import { define } from "../utils.ts";
import { Head } from "fresh/runtime";
import { getRecipes } from "../../shared/supabase/index.ts";
import type { Recipe } from "../../shared/types/index.ts";

interface Data {
  recipes: Recipe[];
  error?: string;
}

export const handler = define.handlers({
  GET: async (ctx) => {
    try {
      const accessToken = ctx.req.headers
        .get("cookie")
        ?.match(/access_token=([^;]+)/)?.[1];
      const recipes = await getRecipes(accessToken);
      return {
        data: { recipes },
      };
    } catch (error) {
      console.error(error);
      return {
        data: [],
      };
    }
  },
});

export default define.page(function DashboardPage({ data }) {
  const { recipes, error } = data as Data;

  return (
    <div class="min-h-screen bg-base-200">
      <Head>
        <title>Recipe Dashboard - Openrecipes</title>
      </Head>

      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Recipe Dashboard</h1>

        {error && (
          <div class="alert alert-error mb-8">
            <span>{error}</span>
          </div>
        )}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes?.map((recipe) => (
            <div key={recipe.id} class="card bg-base-100 shadow-xl">
              <figure>
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  class="w-full h-48 object-cover"
                />
              </figure>
              <div class="card-body">
                <h2 class="card-title">{recipe.title}</h2>
                <div class="flex items-center gap-2">
                  <div class="rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <input
                        key={star}
                        type="radio"
                        name={`rating-${recipe.id}`}
                        class="mask mask-star-2 bg-orange-400"
                        checked={recipe.rating >= star}
                        readOnly
                      />
                    ))}
                  </div>
                  <span class="text-sm text-base-content/70">
                    ({recipe.rating}/5)
                  </span>
                </div>
                <p class="text-sm text-base-content/70">
                  Serves: {recipe.defaultServes}
                </p>
                <div class="flex flex-wrap gap-1 mt-2">
                  {recipe.tags?.map((tag) => (
                    <span key={tag.id} class="badge badge-outline">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!recipes?.length && !error && (
          <div class="text-center py-12">
            <p class="text-lg text-base-content/70">No recipes found.</p>
          </div>
        )}
      </div>
    </div>
  );
});
