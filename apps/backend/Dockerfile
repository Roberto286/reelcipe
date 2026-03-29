# syntax=docker/dockerfile:1

FROM denoland/deno:2.5.5 AS builder
WORKDIR /app

ENV DENO_DIR=/deno-cache

# Copy dependency manifests first for layer caching
COPY deno.json deno.lock ./

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

# Cache dependencies and application
WORKDIR /app/apps/backend
RUN deno cache --lock=/app/deno.lock main.ts

# Runtime stage
FROM denoland/deno:2.5.5
WORKDIR /app

ENV DENO_DIR=/deno-cache \
    DENO_ENV=production

# Copy built application and cache
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/deno.json ./deno.json
COPY --from=builder /app/deno.lock ./
COPY --from=builder /deno-cache /deno-cache

# Create non-root user with proper permissions
RUN groupadd -r appgroup && \
    useradd -r -g appgroup appuser && \
    chown -R appuser:appgroup /app /deno-cache

USER appuser

EXPOSE 8000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD deno eval "await fetch('http://localhost:8000/health').then(r => r.ok ? Deno.exit(0) : Deno.exit(1)).catch(() => Deno.exit(1))"

WORKDIR /app/apps/backend

# JSON array form ensures proper SIGTERM handling for graceful shutdown
CMD ["deno", "run", "--allow-net", "--allow-env", "main.ts"]
