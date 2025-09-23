FROM denoland/deno:latest

WORKDIR /app

# Prima copia solo i file di dipendenze
COPY deno.json deno.lock* ./

COPY . .

RUN deno cache main.ts

EXPOSE 5173
EXPOSE 9229
CMD ["deno", "task", "inspect"]