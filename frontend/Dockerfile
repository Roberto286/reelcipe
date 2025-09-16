FROM denoland/deno:latest

WORKDIR /app

# Prima copia solo i file di dipendenze
COPY deno.json deno.lock* ./

#This can be removed as soon as they fix the compatibility bug
RUN deno upgrade canary

COPY . .

RUN deno cache main.ts

EXPOSE 5173
CMD ["deno", "task", "dev"]