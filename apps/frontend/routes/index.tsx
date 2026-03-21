import { define } from "../utils.ts";
import { Head } from "fresh/runtime";

export default define.page(function Home({ state }) {
  const isAuthenticated = !!state.authenticated;

  return (
    <div class="min-h-screen bg-base-200">
      <Head>
        <title>reelcipe - Your Recipe Collection</title>
      </Head>

      {/* Hero Section */}
      <section class="hero bg-base-100 min-h-[60vh]">
        <div class="hero-content text-center py-12">
          <div class="max-w-2xl">
            <div class="flex justify-center mb-6">
              <img src="/logo.svg" alt="reelcipe logo" class="w-24 h-24" />
            </div>
            <h1 class="text-5xl font-bold mb-4 text-base-content">
              Welcome to reelcipe
            </h1>
            <p class="text-xl text-base-content/70 mb-8">
              Save, organize, and discover recipes from around the web. 
              Generate recipes from any URL with AI-powered extraction.
            </p>
            
            {isAuthenticated ? (
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/recipes" class="btn btn-primary btn-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Browse Recipes
                </a>
                <a href="/generate" class="btn btn-outline btn-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Generate New Recipe
                </a>
              </div>
            ) : (
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/login" class="btn btn-primary btn-lg">
                  Get Started
                </a>
                <a href="/generate" class="btn btn-outline btn-lg">
                  Try Demo
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="py-12 px-4">
        <div class="container mx-auto max-w-5xl">
          <h2 class="text-3xl font-bold text-center mb-10 text-base-content">
            Features
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body items-center text-center">
                <div class="p-3 bg-primary/10 rounded-full mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                </div>
                <h3 class="card-title text-lg">URL Import</h3>
                <p class="text-base-content/70">
                  Paste any recipe URL and we'll extract the ingredients, 
                  instructions, and images automatically.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body items-center text-center">
                <div class="p-3 bg-secondary/10 rounded-full mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A2 2 0 0 1 3 12V7a4 4 0 0 1 4-4Z" />
                  </svg>
                </div>
                <h3 class="card-title text-lg">Organize</h3>
                <p class="text-base-content/70">
                  Tag, categorize, and organize your recipes into 
                  collections. Find what you need instantly.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body items-center text-center">
                <div class="p-3 bg-accent/10 rounded-full mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 0 1 12 21c-2.8 0-5.2-1.4-6.657-3.656m0 0A11 11 0 0 1 3 12c0-2.8 1.4-5.2 3.343-6.657m12 0a8 8 0 1 0-16 0 8 8 0 0 0 16 0Z" />
                  </svg>
                </div>
                <h3 class="card-title text-lg">Discover</h3>
                <p class="text-base-content/70">
                  Keep track of recipes from your favorite food blogs 
                  and cooking websites in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions for authenticated users */}
      {isAuthenticated && (
        <section class="py-12 px-4 bg-base-100">
          <div class="container mx-auto max-w-5xl">
            <h2 class="text-3xl font-bold text-center mb-10 text-base-content">
              Quick Actions
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <a href="/generate" class="card bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                <div class="card-body flex-row items-center gap-4">
                  <div class="p-3 bg-primary/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="card-title text-base">Generate Recipe</h3>
                    <p class="text-sm text-base-content/70">Import from any URL</p>
                  </div>
                </div>
              </a>
              <a href="/recipes" class="card bg-secondary/5 hover:bg-secondary/10 cursor-pointer transition-colors">
                <div class="card-body flex-row items-center gap-4">
                  <div class="p-3 bg-secondary/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="card-title text-base">View All Recipes</h3>
                    <p class="text-sm text-base-content/70">Browse your collection</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer class="footer footer-center p-6 bg-base-100 text-base-content mt-auto">
        <div>
          <p class="text-sm opacity-70">
            © {new Date().getFullYear()} reelcipe — Save and organize recipes from around the web
          </p>
        </div>
      </footer>
    </div>
  );
});
