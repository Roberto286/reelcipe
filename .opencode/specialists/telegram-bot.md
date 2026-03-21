# Telegram Bot Specialist

## Overview
- **Tech Stack**: Telegraf (Telegram Bot API), Express, TypeScript, session middleware
- **Port**: 8001
- **Purpose**: Telegram bot interface for user authentication, login flow, and processing reel URLs to trigger recipe generation

## Key Files
- `src/index.ts` - Main entry, bot initialization, Express/Telegraf setup
- `src/bot/commands/start.ts` - `/start` command handler
- `src/bot/commands/login.ts` - `/login` command handler
- `src/bot/commands/register.ts` - `/register` command handler
- `src/bot/handlers/reel.ts` - Reel URL message handler
- `src/bot/middleware/session.ts` - Session middleware for conversation state
- `src/server/express.ts` - Express server for auth callbacks (/user-registered, /user-logged-in)
- `src/utils/auth.ts` - Token validation and user helpers
- `src/types/index.ts` - Local type definitions matching shared package

## Boundaries
### What This Package Owns
- Telegram bot commands and message handlers
- Session state management for bot conversations
- Express server for frontend auth callbacks
- Webhook endpoint configuration
- Reel URL validation and forwarding to recipe generator
- Bot-user conversation flow

### What This Package Does NOT Own
- Backend API (handled by apps/backend)
- Frontend rendering (handled by apps/frontend)
- Recipe generation pipeline (handled by apps/recipe-generator)
- Actual user registration data storage (delegated to backend)

### Shared Package Dependencies
- Imports types from `@reelcipe/shared`: `Recipe`, `GeneratedRecipe`, user types
- Types used for typing recipe data sent to backend and received from generator
- Auth callback data typed using shared interfaces

## Conventions
### Code Style
- Bot commands in `src/bot/commands/`, handlers in `src/bot/handlers/`
- Session state typed via `TelegrafContext` with custom session interface
- Error handling: Bot commands return user-friendly messages on failure
- Variables: camelCase for runtime values, SCREAMING_SNAKE_CASE for env vars

### API Patterns
- Bot uses webhook mode for receiving Telegram updates
- Express runs on port 8001 at `/user-registered` and `/user-logged-in`
- Reel flow: `validate URL` → `POST to RECIPE_GENERATOR_BASE_URL/recipe`
- Auth tokens passed in headers: `Authorization: Bearer <token>`, `X-User-ID: <id>`

### Express Server Routes
- `POST /user-registered` - Receives registration confirmation from frontend
- `POST /user-logged-in` - Receives login confirmation, sends Telegram message to user

## Common Issues & Debugging
1. **Bot not responding**: Check webhook configuration; verify Telegram API token in `BOT_TOKEN` env var
2. **Session lost between messages**: Verify session middleware properly configured; check Redis/memory session store
3. **Auth callback failing**: Ensure Express routes match frontend callback URLs; check CORS settings
4. **Recipe generator timeout**: Reels over 20 minutes may timeout; implement retry logic or user notification
5. **Message flooding**: Implement rate limiting middleware to prevent bot spam

## Code Review Checklist
- [ ] All bot commands have help text and error handling
- [ ] Session middleware properly typed and initialized before bot handlers
- [ ] Auth callbacks validate request signatures or tokens
- [ ] Express server has proper JSON body parsing middleware
- [ ] Reel URL validation before sending to recipe generator
- [ ] No hardcoded bot token (use BOT_TOKEN env var)
- [ ] Rate limiting on Express endpoints to prevent abuse
- [ ] User feedback provided for long-running operations (recipe generation)
