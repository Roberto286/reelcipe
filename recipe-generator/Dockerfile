
# Stage 1: Python dependencies
FROM denoland/deno:debian-2.5.0 AS python-deps

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --no-cache-dir yt-dlp moviepy \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Deno dependencies
FROM denoland/deno:debian-2.5.0 AS deno-deps

WORKDIR /app

# Copia solo i file di dipendenze
COPY deno.json deno.lock* ./

# Cache delle dipendenze Deno
RUN deno cache --lock=deno.lock deno.json || true

# Stage 3: Builder
FROM denoland/deno:debian-2.5.0 AS builder

WORKDIR /app

# Copia dipendenze Deno dallo stage precedente
COPY --from=deno-deps /app/deno.json /app/deno.lock* ./
COPY --from=deno-deps /root/.cache/deno /root/.cache/deno

# Copia il codice sorgente
COPY . .

# Cache del main.js
RUN deno cache src/main.js

# Stage 4: Runtime
FROM denoland/deno:debian-2.5.0

# Installa solo i runtime necessari (no build-essential)
RUN apt-get update && apt-get install -y \
    python3 ffmpeg bash git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia Python venv dallo stage python-deps
COPY --from=python-deps /opt/venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copia l'applicazione builddata dallo stage builder
COPY --from=builder /app ./
COPY --from=builder /root/.cache/deno /root/.cache/deno

EXPOSE 5173
EXPOSE 9229

CMD ["deno", "task", "dev"]