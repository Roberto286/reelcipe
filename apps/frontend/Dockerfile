# syntax=docker/dockerfile:1

ARG GIT_REVISION=latest

FROM denoland/deno:2.5.5 AS builder
ARG GIT_REVISION

WORKDIR /app

ENV DENO_DEPLOYMENT_ID=${GIT_REVISION} \
    DENO_DIR=/deno-cache

# Copy workspace files and source code
COPY deno.json deno.lock* ./
COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared

# Build application
WORKDIR /app/apps/frontend
RUN deno cache --lock=/app/deno.lock main.ts && \
    deno run -A npm:vite build && \
    deno cache _fresh/server.js

# Runtime stage
FROM denoland/deno:2.5.5
ARG GIT_REVISION

WORKDIR /app

ENV DENO_DEPLOYMENT_ID=${GIT_REVISION} \
    DENO_DIR=/deno-cache \
    DENO_ENV=production

# Copy built application and cache
COPY --from=builder /app/apps/frontend/_fresh ./apps/frontend/_fresh
COPY --from=builder /app/apps/frontend/static ./apps/frontend/static
COPY --from=builder /app/apps/frontend/deno.json ./apps/frontend/deno.json
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/deno.json ./deno.json
COPY --from=builder /deno-cache /deno-cache

# Create non-root user
RUN groupadd -r appgroup && \
    useradd -r -g appgroup appuser && \
    chown -R appuser:appgroup /app /deno-cache

USER appuser

EXPOSE 8000

WORKDIR /app/apps/frontend

CMD ["deno", "serve", "-A", "_fresh/server.js"]
