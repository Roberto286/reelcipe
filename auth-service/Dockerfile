# Stage 1: Dependencies
FROM denoland/deno:2.5.1 AS deps

WORKDIR /app

# Copia solo i file di dipendenze
COPY auth-service/deno.json auth-service/deno.lock* ./

# Stage 2: Builder
FROM denoland/deno:2.5.1 AS builder

WORKDIR /app

# Copia dipendenze dallo stage precedente
COPY --from=deps /app/deno.json /app/deno.lock* ./

# Copia il pacchetto shared (dipendenza locale)
COPY shared /shared

# Copia il codice sorgente
COPY auth-service .

# Cache del main.ts
RUN deno cache --sloppy-imports main.ts

# Stage 3: Runtime
FROM denoland/deno:2.5.1

WORKDIR /app

# Copia il pacchetto shared
COPY --from=builder /shared /shared

# Copia l'applicazione dallo stage builder
COPY --from=builder /app ./

EXPOSE 8000
EXPOSE 9229

CMD ["deno", "task", "start"]
