# Frontend Specialist

## Overview
- **Tech Stack**: Fresh (Deno framework), Preact, Vite, Tailwind CSS, daisyUI, TypeScript
- **Port**: 3500 (development: Vite dev server on 5173)
- **Purpose**: User-facing web interface for browsing recipes, logging in, and generating new recipes from social media reels

## Key Files
- `routes/index.tsx` - Landing page, redirects to /recipes or /login
- `routes/login.tsx` - Authentication page with ?mode=signup&telegram_id=X&telegram_username=Y support
- `routes/generate.tsx` - Recipe generation page with URL input
- `routes/recipes/index.tsx` - Recipe listing page
- `routes/recipes/[id].tsx` - Individual recipe detail page
- `islands/` - Client-side interactive components (Preact islands)
- `main.ts` - Fresh application entry point
- `fresh.config.ts` - Fresh/Vite configuration

## Boundaries
### What This Package Owns
- Server-side rendering via Fresh handlers
- Client-side interactivity via Preact islands
- API calls to backend (apps/backend:8000)
- Client-side Supabase auth integration
- Tailwind/daisyUI styling and theming
- Route definitions and page components

### What This Package Does NOT Own
- Backend API logic (handled by apps/backend)
- Authentication session management (handled by backend Better-Auth)
- Recipe generation pipeline (handled by apps/recipe-generator)
- Telegram bot functionality (handled by apps/telegram-bot)

### Shared Package Dependencies
- Imports types from `@reelcipe/shared`: `Recipe`, `Ingredient`, `Method`, `Tag`, `Cookbook`, `GeneratedRecipe`
- Types used for typing API responses and component props
- Ensure imported types match shared package versions

## Conventions
### Code Style
- Components: PascalCase for components (e.g., `RecipeCard.tsx`), camelCase for utilities
- Islands: Components in `islands/` run client-side only
- Routes: Handler functions use `Request` and `Response` objects
- Styling: Tailwind classes, daisyUI component classes, custom theme colors

### Import Patterns
```typescript
import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { Recipe } from "@reelcipe/shared";
```

### API Patterns
- API calls to backend: `fetch("http://localhost:8000/api/...")`
- Request headers: `Authorization: Bearer <token>` for authenticated routes
- Login supports query params: `?mode=signup&telegram_id=123&telegram_username=bot_name`
- Response handling: Check `response.ok` before parsing JSON

## Common Issues & Debugging
1. **Vite dev server not starting**: Check `deno.json` and `fresh.config.ts`; run `deno task start`
2. **Island not hydrating**: Ensure component is in `islands/` directory and exported correctly
3. **API calls failing with CORS**: Verify frontend origin is in backend CORS allowed list
4. **Tailwind styles not applying**: Check `tailwind.config.ts` and `daisyUI` plugin setup
5. **Type errors with @reelcipe/shared**: Run `deno cache -r @reelcipe/shared` to update cached dependencies

## Code Review Checklist
- [ ] All API calls include error handling for network failures
- [ ] Auth tokens stored securely, passed in Authorization header
- [ ] Islands only contain client-side logic (no Deno APIs)
- [ ] Tailwind classes use design system tokens (no arbitrary colors)
- [ ] Login page correctly parses `telegram_id` and `telegram_username` query params
- [ ] No secrets or credentials hardcoded in client-side code
- [ ] Responsive design works on mobile (daisyUI responsive classes)
- [ ] Images use proper alt text for accessibility
