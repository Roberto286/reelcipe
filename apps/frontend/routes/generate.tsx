import { define } from "../utils.ts";

type GeneratePageState = {
  message?: string;
  error?: string;
  recipeId?: string;
};

export default define.page(function Generate(ctx) {
  const url = new URL(ctx.req.url);
  const message = url.searchParams.get("message");
  const error = url.searchParams.get("error");
  const recipeId = url.searchParams.get("recipeId");
  const isSuccess = !!message;
  const isError = !!error;

  return (
    <div class="min-h-screen bg-base-200">
      <div class="container mx-auto px-4 py-12 max-w-2xl">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-base-content mb-2">
            Generate Recipe
          </h1>
          <p class="text-base-content/70">
            Paste a recipe URL from any website and we'll extract the details for you.
          </p>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <div class="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-semibold">{message}</p>
              {recipeId && (
                <p class="text-sm mt-1">
                  <a href={`/recipes/${recipeId}`} class="link link-primary">
                    View your new recipe →
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {isError && (
          <div class="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Generate Form */}
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <form action="/api/recipes" method="post" class="space-y-6">
              <fieldset class="fieldset">
                <legend class="fieldset-legend text-lg font-semibold">
                  Recipe URL
                </legend>
                <div class="join w-full">
                  <input
                    type="url"
                    id="url"
                    name="url"
                    placeholder="https://example.com/recipe/chocolate-chip-cookies"
                    class="input input-bordered w-full join-item"
                    required
                    aria-describedby="url-help"
                  />
                  <button type="submit" class="btn btn-primary join-item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </button>
                </div>
                <p id="url-help" class="fieldset-label text-base-content/60">
                  Supported: Most recipe websites, food blogs, and cooking platforms
                </p>
              </fieldset>
            </form>

            {/* Info Box */}
            <div class="alert alert-info mt-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="text-sm">
                <p class="font-semibold">How it works</p>
                <p class="text-base-content/80">
                  We analyze the webpage to extract ingredients, instructions, cooking times, 
                  and images. The process usually takes a few seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div class="mt-8">
          <h2 class="text-lg font-semibold mb-3 text-base-content">
            Tips for best results
          </h2>
          <ul class="space-y-2 text-sm text-base-content/70">
            <li class="flex items-start gap-2">
              <span class="text-success">✓</span>
              Use direct recipe URLs rather than homepage links
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success">✓</span>
              Recipe pages with structured data work best
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success">✓</span>
              Make sure the page contains a complete recipe with ingredients and instructions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});
