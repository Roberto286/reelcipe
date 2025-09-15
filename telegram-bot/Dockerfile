FROM node:22-alpine

WORKDIR /app
RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml* ./
COPY .env .

RUN npm install
COPY src src
CMD ["pnpm", "start"]