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

COPY apps/telegram-bot ./apps/telegram-bot
COPY packages/shared ./packages/shared

WORKDIR /app/apps/telegram-bot
RUN deno cache src/main.js

# Stage runtime
FROM denoland/deno:2.5.1
WORKDIR /app
COPY --from=builder /app ./

# Directory persistente del bot
RUN mkdir -p db

EXPOSE 8000
WORKDIR /app/apps/telegram-bot

CMD ["deno", "task", "start"]
