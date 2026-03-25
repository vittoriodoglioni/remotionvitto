# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-slim AS base

# Chromium y dependencias para Remotion renderer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    libxss1 \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Decirle a Remotion dónde está Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium

WORKDIR /app

# Instalar dependencias
COPY package.json ./
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

# Crear carpeta de output
RUN mkdir -p output

EXPOSE 3100

CMD ["node", "server.js"]
