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

COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared

WORKDIR /app/apps/frontend
RUN deno cache main.ts

# Stage runtime
FROM denoland/deno:2.5.5
WORKDIR /app/
COPY --from=builder /app ./

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5173 8000

WORKDIR /app/apps/frontend

CMD ["deno", "task", "dev"]
