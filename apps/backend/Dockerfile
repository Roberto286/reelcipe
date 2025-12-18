# Stage deps
FROM denoland/deno:2.5.1 AS deps
WORKDIR /app

COPY deno.json deno.lock* ./

# Cache dipendenze
RUN deno cache --lock=deno.lock deno.json

# Stage builder
FROM denoland/deno:2.5.1 AS builder
WORKDIR /app

COPY --from=deps /app/deno.json /app/deno.lock* ./

COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

WORKDIR /app/apps/backend
RUN deno cache main.ts

# Stage runtime
FROM denoland/deno:2.5.1
WORKDIR /app/
COPY --from=builder /app .

EXPOSE 8000

WORKDIR /app/apps/backend
CMD ["deno", "task", "start"]
