import { Head } from "fresh/runtime";

export default function Error404() {
  return (
    <div class="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <Head>
        <title>404 - Page not found | reelcipe</title>
      </Head>
      <div class="card bg-base-100 shadow-2xl max-w-md w-full">
        <div class="card-body items-center text-center">
          <div class="mb-4">
            <img
              src="/logo.svg"
              width="96"
              height="96"
              alt="reelcipe logo"
              class="mx-auto"
            />
          </div>
          <h1 class="text-4xl font-bold text-error mb-2">404</h1>
          <h2 class="card-title text-xl mb-2">Page Not Found</h2>
          <p class="text-base-content/70 mb-6">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved or deleted.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 w-full">
            <a href="/" class="btn btn-primary flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </a>
            <a href="/recipes" class="btn btn-outline flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Browse Recipes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
