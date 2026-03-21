# Stage deps
FROM denoland/deno:2.5.5 AS deps
WORKDIR /app

COPY deno.json deno.lock* ./

# Cache dipendenze
RUN deno cache --lock=deno.lock deno.json

# Stage builder
FROM denoland/deno:2.5.5 AS builder
WORKDIR /app

COPY --from=deps /app/deno.json /app/deno.lock* ./

COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

WORKDIR /app/apps/backend
RUN deno cache main.ts

# Stage runtime
FROM denoland/deno:2.5.5
WORKDIR /app/
COPY --from=builder /app .

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

WORKDIR /app/apps/backend
CMD ["deno", "task", "start"]
