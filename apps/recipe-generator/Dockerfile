# Stage python deps
FROM denoland/deno:debian-2.5.1 AS python-deps

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --no-cache-dir yt-dlp moviepy \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# Stage Deno deps
FROM denoland/deno:debian-2.5.1 AS deno-deps

WORKDIR /app

COPY deno.json deno.lock* ./

# Cache dipendenze
RUN deno cache --lock=deno.lock deno.json

# Stage builder
FROM denoland/deno:debian-2.5.1 AS builder

WORKDIR /app

COPY --from=deno-deps /app/deno.json /app/deno.lock* ./

COPY apps/recipe-generator ./apps/recipe-generator
COPY packages/shared ./packages/shared

WORKDIR /app/apps/recipe-generator
RUN deno cache src/main.js

# Stage runtime
FROM denoland/deno:debian-2.5.1

RUN apt-get update && apt-get install -y \
    python3 ffmpeg bash git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Python venv
COPY --from=python-deps /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app/

COPY --from=builder /app ./
EXPOSE 5173

WORKDIR /app/apps/recipe-generator
CMD ["deno", "task", "dev"]
