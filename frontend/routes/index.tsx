import { define } from "../utils.ts";
import { Head } from "fresh/runtime";

export default define.page(function Home(ctx) {
  const url = new URL(ctx.req.url);
  const message = url.searchParams.get("message");
  const error = url.searchParams.get("error");
  const recipeId = url.searchParams.get("recipeId");

  return (
    <div class="px-4 py-8 mx-auto min-h-screen">
      <Head>
        <title>Openrecipes</title>
      </Head>

      <form action="/api/generate-recipe" method="post" class="space-y-4">
        <div>
          <label for="url" class="label">
            <span class="label-text">Recipe URL</span>
          </label>
          <input
            type="url"
            id="url"
            name="url"
            placeholder="Enter recipe URL"
            class="input input-bordered w-full"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary">
          Generate & Save Recipe
        </button>
      </form>

      {message && (
        <div class="alert alert-success mt-4">
          {message} {recipeId && `(ID: ${recipeId})`}
        </div>
      )}

      {error && (
        <div class="alert alert-error mt-4">
          {error}
        </div>
      )}
    </div>
  );
});
