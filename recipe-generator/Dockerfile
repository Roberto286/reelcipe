
FROM denoland/deno:debian-2.5.0

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv ffmpeg bash git build-essential \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --no-cache-dir yt-dlp moviepy

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Prima copia solo i file di dipendenze
COPY deno.json deno.lock* ./

COPY . .

RUN deno cache src/main.js

EXPOSE 5173
EXPOSE 9229
CMD ["deno", "task", "dev"]