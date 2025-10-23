FROM denoland/deno:2.5.1

WORKDIR /app

# Prima copia solo i file di dipendenze
COPY deno.json deno.lock* ./

COPY . .

RUN deno cache main.ts

EXPOSE 5173
EXPOSE 9229
CMD ["deno", "task", "dev"]