# Backend Specialist

## Overview
- **Tech Stack**: Hono, MongoDB (mongodb npm package), Better-Auth, TypeScript
- **Port**: 8000
- **Purpose**: REST API backend providing authentication, recipe management, cookbook organization, and tag categorization for the Reelcipe system

## Key Files
- `src/index.ts` - Main Hono application entry, route registration, CORS setup
- `src/routes/recipes.ts` - CRUD operations for /api/recipes endpoint
- `src/routes/tags.ts` - Tag management endpoints
- `src/routes/cookbooks.ts` - Cookbook CRUD operations
- `src/routes/auth/[...auth].ts` - Better-Auth authentication routes
- `src/middleware/auth.ts` - Bearer token extraction from session, user validation
- `src/utils/db.ts` - MongoDB connection via `connectDB()` function
- `src/types/index.ts` - TypeScript interfaces matching @reelcipe/shared types

## Boundaries
### What This Package Owns
- MongoDB database connection and queries
- User authentication via Better-Auth (session management, token validation)
- Recipe, Tag, and Cookbook CRUD operations
- CORS configuration for frontend origins
- API response formatting

### What This Package Does NOT Own
- Frontend rendering (handled by apps/frontend)
- Telegram bot integration (handled by apps/telegram-bot)
- Recipe generation/AI processing (handled by apps/recipe-generator)
- Client-side auth state (handled by frontend Supabase)

### Shared Package Dependencies
- Imports types from `@reelcipe/shared`: `Recipe`, `Tag`, `Cookbook`, `RecipeTag`, `CookbookRecipe`, `Ingredient`, `Method`, `GeneratedRecipe`
- Types in `src/types/index.ts` must match shared package exports exactly
- Used for request/response typing across all API endpoints

## Conventions
### Code Style
- Route handlers use `c.json()` for responses with appropriate HTTP status codes
- Async handlers wrapped with `try/catch` returning 500 on errors
- Variables: camelCase for variables, PascalCase for types/interfaces
- File naming: kebab-case for route files (e.g., `cookbooks.ts`)

### API Patterns
- Route naming: `/api/{resource}` pluralized (e.g., `/api/recipes`, `/api/tags`)
- Response format: Consistent JSON with data or error message
  ```json
  { "data": [...] } or { "error": "message" }
  ```
- Auth: Bearer token in Authorization header extracted by middleware
- Status codes: 200 success, 201 created, 400 bad request, 401 unauthorized, 500 server error

### Error Handling
- Auth middleware returns 401 if token missing/invalid
- Database errors return 500 with sanitized message
- Validation errors return 400 with field-specific messages

## Common Issues & Debugging
1. **CORS errors**: Ensure origin is in allowed list (`localhost:3500`, `frontend:5173`) in `src/index.ts`
2. **Auth token invalid**: Check that Better-Auth session is valid; token format should be `Bearer <session_token>`
3. **MongoDB connection failed**: Verify `MONGODB_URI` env var; check `connectDB()` in `src/utils/db.ts`
4. **Type mismatches**: Ensure `src/types/index.ts` stays in sync with `@reelcipe/shared` exports
5. **Slow queries**: Check MongoDB indexes on `recipes` collection; add compound indexes for common queries

## Code Review Checklist
- [ ] All routes have appropriate auth middleware protecting write operations
- [ ] Error responses include meaningful messages without exposing internals
- [ ] MongoDB queries use proper projection to avoid returning unnecessary fields
- [ ] Types imported from `@reelcipe/shared` match exactly (no manual duplication)
- [ ] CORS origins are restricted to known frontend URLs only
- [ ] Async operations wrapped in try/catch with proper error responses
- [ ] Status codes match REST conventions (201 for create, 400 for validation errors)
- [ ] No hardcoded credentials or secrets (use env vars)
