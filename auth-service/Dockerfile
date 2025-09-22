FROM denoland/deno:alpine

WORKDIR /app

# Prima copia solo i file di dipendenze
COPY deno.json deno.lock* ./

# Poi copia il resto del codice
COPY . .

# Cache delle dipendenze (layer separato)
RUN deno cache main.ts

EXPOSE 8000
CMD ["deno", "task", "inspect"]