# Reelcipe

A recipe management platform with AI-powered recipe generation, Telegram bot integration, and a modern web interface.

## Features

- **Web Interface** - Fresh-based frontend for browsing and managing recipes
- **AI Recipe Generation** - Generate recipes from URLs using OpenAI
- **Telegram Bot** - Interactive recipe management via Telegram
- **REST API** - Hono-based backend with MongoDB storage
- **Session Authentication** - Secure authentication via better-auth

## Architecture

```
reelcipe/
├── apps/
│   ├── backend/          # Hono API server (Deno, TypeScript)
│   ├── frontend/         # Fresh web app (Deno, TypeScript/TSX)
│   ├── recipe-generator/  # AI recipe generation (Node.js)
│   └── telegram-bot/     # Telegram bot integration (Node.js)
├── packages/
│   └── shared/           # Shared types and utilities (Deno)
└── compose/              # Docker Compose configurations
```

| Service | Runtime | Framework | Language |
|---------|---------|-----------|----------|
| backend | Deno | Hono | TypeScript |
| frontend | Deno | Fresh | TypeScript/TSX |
| recipe-generator | Node.js | Native | JavaScript |
| telegram-bot | Node.js | Native | JavaScript |
| shared | Deno | - | TypeScript |

## Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) v1.40+
- [Node.js](https://nodejs.org/) v18+ (for recipe-generator and telegram-bot)
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [MongoDB](https://www.mongodb.com/) (included in Docker Compose)

## Quick Start

### Development

```bash
# Start all services in development mode (with hot reload)
deno task start:dev

# View logs
deno task logs

# Stop services
deno task down

# Stop and remove volumes
deno task nuke
```

### Production

```bash
# Build and start all services
deno task start:prod

# Stop services
deno task down
```

## Docker Compose Production Example

The following is a complete production-ready `docker-compose.yml` configuration. Save this as `compose/compose.prod.yml` or use the default at `compose/compose.yml` with `compose/compose.prod.yml`.

```yaml
services:
  mongodb:
    image: mongo:6.0
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: reelcipe
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks: [reelcipe-network]

  backend:
    build:
      context: ./
      dockerfile: apps/backend/Dockerfile
    container_name: backend
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      MONGODB_URI: mongodb://mongodb:27017/reelcipe
      MONGODB_DB: reelcipe
      PORT: 8000
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      DENO_ENV: production
    command: deno task start
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "deno", "eval", "await fetch('http://localhost:8000/health').then(r => r.ok ? Deno.exit(0) : Deno.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks: [reelcipe-network]

  frontend:
    build:
      context: ./
      dockerfile: apps/frontend/Dockerfile
    container_name: frontend
    environment:
      DENO_ENV: production
    ports:
      - "3500:8000"
    command: deno task start
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "deno", "eval", "await fetch('http://localhost:8000').then(r => r.ok ? Deno.exit(0) : Deno.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks: [reelcipe-network]

  telegram-bot:
    build:
      context: ./
      dockerfile: apps/telegram-bot/Dockerfile
    container_name: telegram-bot
    environment:
      BOT_TOKEN: ${BOT_TOKEN}
      REFRESH_TOKEN_ENCRYPTION_KEY: ${REFRESH_TOKEN_ENCRYPTION_KEY}
      RECIPE_GENERATOR_BASE_URL_DOCKER: http://recipe-generator:3000
      REELCIPE_FE_BASEURL: ${REELCIPE_FE_BASEURL}
      BACKEND_URL: http://backend:8000
      DENO_ENV: production
      RUNNER: docker
    dns:
      - 1.1.1.1
      - 8.8.8.8
    extra_hosts:
      - "api.telegram.org:149.154.167.220"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "deno", "eval", "Deno.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks: [reelcipe-network]

  recipe-generator:
    build:
      context: ./
      dockerfile: apps/recipe-generator/Dockerfile
    container_name: recipe-generator
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      BACKEND_URL: http://backend:8000
      PORT: 3000
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "deno eval 'Deno.connectTcp({port: 3000}).then(() => Deno.exit(0)).catch(() => Deno.exit(1))'"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks: [reelcipe-network]

volumes:
  mongodb-data:

networks:
  reelcipe-network:
    name: ${COMPOSE_PROJECT_NAME:-reelcipe}_network
```

### Running Production

```bash
# Using default compose files
deno task start:prod

# Or directly with docker compose
docker compose -f compose/compose.yml -f compose/compose.prod.yml --env-file .env up -d --build
```

### Port Reference

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3500 | Web application |
| backend | 8000 | REST API |
| mongodb | 27017 | Database |
| recipe-generator | 3000 | AI generation service |

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
MONGODB_URI=mongodb://mongodb:27017/reelcipe
MONGODB_DB=reelcipe

# Backend
PORT=8000
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:8000

# Frontend
DENO_ENV=production

# Telegram Bot
BOT_TOKEN=your-telegram-bot-token
REFRESH_TOKEN_ENCRYPTION_KEY=your-encryption-key
RUNNER=docker
RECIPE_GENERATOR_BASE_URL_DOCKER=http://recipe-generator:3000
REELCIPE_FE_BASEURL=http://localhost:3500

# Recipe Generator
OPENAI_API_KEY=your-openai-api-key
BACKEND_URL=http://backend:8000

# Docker Compose
COMPOSE_PROJECT_NAME=reelcipe
```

## Services

### Backend API

```bash
cd apps/backend
deno task dev        # Development with hot reload
deno task start      # Production start
deno fmt . && deno lint . && deno check  # Format, lint, and type check
```

### Frontend Web App

```bash
cd apps/frontend
deno task dev        # Development server (Vite)
deno task build      # Production build
deno task check      # Format + lint + type check
```

### Recipe Generator

```bash
cd apps/recipe-generator
npm run dev        # Development server
npm run start      # Production start
biome format . && biome lint .  # Format and lint
```

### Telegram Bot

```bash
cd apps/telegram-bot
npm run dev        # Development with hot reload
npm run start      # Production start
```

## API Routes

| Route | Description |
|-------|-------------|
| `/api/recipes` | Recipe CRUD operations, search, and filtering |
| `/api/tags` | Tag creation, listing, and management |
| `/api/cookbooks` | Cookbook (collection) management |

## License

MIT
