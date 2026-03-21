# Stage python deps
FROM denoland/deno:debian-2.5.5 AS python-deps

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --no-cache-dir yt-dlp moviepy \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# Stage Deno deps
FROM denoland/deno:debian-2.5.5 AS deno-deps

WORKDIR /app

COPY deno.json deno.lock* ./

# Cache dipendenze
RUN deno cache --lock=deno.lock deno.json

# Stage builder
FROM denoland/deno:debian-2.5.5 AS builder

WORKDIR /app

COPY --from=deno-deps /app/deno.json /app/deno.lock* ./

COPY apps/recipe-generator ./apps/recipe-generator
COPY packages/shared ./packages/shared

WORKDIR /app/apps/recipe-generator
RUN deno cache src/main.js

# Stage runtime
FROM denoland/deno:debian-2.5.5

RUN apt-get update && apt-get install -y \
    python3 ffmpeg bash git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Python venv
COPY --from=python-deps /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app/

COPY --from=builder /app ./
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

WORKDIR /app/apps/recipe-generator
CMD ["deno", "task", "dev"]
