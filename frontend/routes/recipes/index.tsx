import { define } from "../../utils.ts";
import { Head } from "fresh/runtime";
import { getRecipes } from "../../../shared/supabase/index.ts";
import type { Recipe } from "../../../shared/types/index.ts";
import RecipeCard from "../../components/recipe-card.tsx";

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
      console.log("accessToken :>> ", accessToken);
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

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {recipes?.map((recipe) => <RecipeCard key={recipe.id} {...recipe} />)}
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
