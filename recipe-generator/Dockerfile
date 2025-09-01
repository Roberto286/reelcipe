FROM node:24-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg bash git build-base \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --no-cache-dir yt-dlp moviepy

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN npm i -g pnpm 

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

COPY src src
COPY .env .

CMD ["pnpm", "start"]
