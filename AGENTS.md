# AGENTS.md - Reelcipe Codebase Guide

This document provides guidelines for agentic coding agents operating in this repository.

## Project Structure

```
reelcipe/
├── apps/
│   ├── backend/          # Hono API server (Deno, TypeScript)
│   ├── frontend/         # Fresh web app (Deno, TypeScript/TSX)
│   ├── recipe-generator/ # Node.js service (JavaScript, Biome)
│   └── telegram-bot/    # Telegram bot (Node.js, JavaScript)
├── packages/
│   └── shared/           # Shared types and utilities (Deno)
└── compose/              # Docker Compose configurations
```

## Build/Lint/Test Commands

### Backend (Deno)
```bash
cd apps/backend
deno task dev        # Development with hot reload
deno task start      # Production start
deno fmt .           # Format code
deno lint .          # Lint code
deno check          # Type check
```

### Frontend (Fresh/Deno)
```bash
cd apps/frontend
deno task dev        # Development server (Vite)
deno task build      # Production build
deno task check      # Format + lint + type check
deno fmt .           # Format code
deno lint .          # Lint code
deno check           # Type check
```

### Recipe Generator (Node.js + Biome)
```bash
cd apps/recipe-generator
deno task dev        # Development server
deno task start      # Production start
biome format .       # Format code
biome lint .         # Lint code
biome check .        # Full check (format + lint)
```

### Telegram Bot (Node.js)
```bash
cd apps/telegram-bot
deno task dev        # Development with hot reload
deno task start      # Production start
```

### Running a Single Test
**No test framework is currently configured.** If adding tests, use:
```bash
# Deno tests
deno test <file>

# Node.js with biome (if configured)
biome test .
```

### Docker Compose (Full Stack)
```bash
# Root directory
deno task start:dev    # Start all services in dev mode
deno task start:prod   # Start all services in prod mode
deno task down          # Stop services
deno task logs          # View logs
deno task nuke          # Stop and remove volumes
```

## Code Style Guidelines

### General Principles
- Use **Deno** runtime for TypeScript projects
- Use **Node.js** for JavaScript-only projects
- Prefer **named exports** over default exports (except for route modules)
- Use **absolute imports** with `@/` alias in frontend
- Always handle errors with try/catch and return proper HTTP status codes

### TypeScript Conventions (Backend/Frontend)

**Imports:**
```typescript
// Named imports (preferred)
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Recipe, Ingredient } from "../types/index.ts";

// Absolute imports (frontend)
import { recipesApi } from "@/utils.ts";
```

**Naming Conventions:**
- **Files:** kebab-case (`recipe-service.ts`, `auth-middleware.ts`)
- **Types/Interfaces:** PascalCase (`interface Recipe`, `type JWTPayload`)
- **Variables/Functions:** camelCase (`connectDB`, `userId`, `recipeTags`)
- **Constants:** SCREAMING_SNAKE_CASE (`MONGODB_URI`, `PORT`)
- **Database fields:** snake_case (`user_id`, `created_at`, `image_url`)

**Types Definition:**
```typescript
// Use interfaces for database documents
export interface Recipe {
  _id?: ObjectId;
  title: string;
  image_url: string;
  downloaded_from: string;
  default_serves: number;
  rating: number;
  user_id: ObjectId;
  created_at: Date;
}
```

**Error Handling:**
```typescript
// Always wrap route handlers in try/catch
try {
  const db = await connectDB();
  const recipe = await db.collection<Recipe>("recipes").findOne({ _id });
  if (!recipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }
  return c.json(transformedRecipe);
} catch (error) {
  console.error("Get recipe error:", error);
  return c.json({ error: "Internal server error" }, 500);
}
```

**Response Format:**
```typescript
// Success responses
return c.json({ message: "Recipe created", recipe_id: id.toString() }, 201);

// Error responses
return c.json({ error: "Not Found" }, 404);
return c.json({ error: "Internal server error" }, 500);
```

### JavaScript Conventions (Recipe Generator/Telegram Bot)

**Imports:**
```javascript
// Use ES modules with .js extension
import { sendBadRequest } from "./http/responses.js";
import { extractBodyFromRequest } from "./lib/extract-body-from-request.js";
```

**Enums:**
```javascript
// Use const objects for enums
export const Status = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
};
```

**Error Handling:**
```javascript
// Check environment variables at startup
function checkEnv() {
  const notValidVars = REQUIRED_ENV_VARIABLES.filter((v) => {
    const envVariable = process.env[v];
    return envVariable === null || envVariable === undefined || envVariable === "";
  });
  if (notValidVars?.length) {
    console.error(`Missing env: ${notValidVars.join(", ")}`);
    process.exit(1);
  }
}

// Wrap async operations
try {
  recipeId = await startRecipeGeneration(url, sessionToken, userId);
} catch (e) {
  console.error("Recipe generation failed:", e.message);
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: e.message || "Internal Server Error" }));
  return;
}
```

### Formatting

**Deno Projects:**
```bash
deno fmt  # Uses default Deno formatting (2-space indent, etc.)
```

**Biome Projects (recipe-generator):**
```json
// biome.json configuration
{
  "formatter": { "enabled": true, "indentStyle": "space" },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": { "formatter": { "quoteStyle": "double" } },
  "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
```

## Database Conventions

- **MongoDB** for backend storage
- **Collections:** plural snake_case (`recipes`, `ingredients`, `recipe_tags`)
- **IDs:** Use `ObjectId` from mongodb driver
- **Dates:** Store as `Date` objects, convert to ISO string for JSON responses
- **Foreign keys:** Use `_id` suffix (`user_id`, `recipe_id`, `tag_id`)

## API Conventions

**Backend Routes:**
- Base path: `/api/recipes`, `/api/tags`, `/api/cookbooks`
- Authentication via `better-auth` session tokens
- Use `authMiddleware` to protect routes
- Return transformed data for frontend consumption

**Response Format:**
```typescript
// List responses with pagination
{
  recipes: [...],
  pagination: { page, limit, total, pages }
}

// Single resource
{ id, title, imageUrl, tags, ingredients, method, ... }

// Mutations
{ message: "...", recipe_id: "..." }
```

## Environment Variables

**Backend:**
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name
- `PORT` - Server port (default: 8000)

**Recipe Generator:**
- `OPENAI_API_KEY` - Required for AI features

**Frontend:**
- Uses `@supabase/supabase-js` for client-side auth
- VITE_* prefix for public env vars

## Key Technologies

| App | Runtime | Framework | Language |
|-----|---------|-----------|----------|
| backend | Deno | Hono | TypeScript |
| frontend | Deno | Fresh | TypeScript/TSX |
| recipe-generator | Node.js | Native | JavaScript |
| telegram-bot | Node.js | Native | JavaScript |
| shared | Deno | - | TypeScript |
