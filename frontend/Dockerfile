# Stage 1: Dependencies
FROM denoland/deno:2.5.1 AS deps

WORKDIR /app

# Copia solo i file di dipendenze
COPY deno.json deno.lock* ./

# Cache delle dipendenze
RUN deno cache --lock=deno.lock deno.json || true

# Stage 2: Build
FROM denoland/deno:2.5.1 AS builder

WORKDIR /app

# Copia dipendenze dallo stage precedente
COPY --from=deps /app/deno.json /app/deno.lock* ./

# Copia il codice sorgente
COPY . .

# Cache del main.ts
RUN deno cache main.ts

# Stage 3: Runtime
FROM denoland/deno:2.5.1

WORKDIR /app

# Copia solo i file necessari per il runtime
COPY --from=builder /app ./

EXPOSE 5173
EXPOSE 9229

CMD ["deno", "task", "dev"]