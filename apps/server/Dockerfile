FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    make \
    g++ \
    libsodium-dev \
    autoconf \
    automake \
    libtool \
    && rm -rf /var/lib/apt/lists/* && \
    ln -sf python3 /usr/bin/python && \
    pip3 install --no-cache-dir yt-dlp --break-system-packages

WORKDIR /usr/src/app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/app/package*.json ./packages/app/

RUN npm install --legacy-peer-deps

COPY . .

WORKDIR /usr/src/app/apps/server

RUN npm install -g ts-node typescript

EXPOSE 3001

CMD ["npm", "run", "dev"]
