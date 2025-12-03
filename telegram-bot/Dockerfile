# Stage 1: Dependencies
FROM denoland/deno:2.5.1 AS deps

WORKDIR /app

# Copia solo i file di dipendenze
COPY telegram-bot/deno.json telegram-bot/jsconfig.json* ./

# Stage 2: Builder
FROM denoland/deno:2.5.1 AS builder

WORKDIR /app

# Copia dipendenze dallo stage precedente
COPY --from=deps /app/deno.json /app/jsconfig.json* ./

# Copia il codice sorgente
COPY telegram-bot .

# Cache del main.js
RUN deno cache src/main.js

# Stage 3: Runtime
FROM denoland/deno:2.5.1

WORKDIR /app

# Copia l'applicazione dallo stage builder
COPY --from=builder /app ./

# Crea la directory db se non esiste
RUN mkdir -p db

EXPOSE 8000

CMD ["deno", "task", "start"]
