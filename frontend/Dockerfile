FROM denoland/deno:alpine

WORKDIR /app

# Prima copia solo i file di dipendenze
COPY deno.json deno.lock* ./

# Cache delle dipendenze (layer separato)
RUN deno cache main.ts

# Poi copia il resto del codice
COPY . .

EXPOSE 8000
CMD ["deno", "task", "start"]