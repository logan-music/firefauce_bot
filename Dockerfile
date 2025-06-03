FROM node:18-slim

# Install Chromium dependencies + Tesseract + fonts
RUN apt-get update && apt-get install -y \
    chromium \
    tesseract-ocr \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    curl \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set working dir
WORKDIR /app

# Copy all source files
COPY package*.json ./
COPY bypass-ptc.js .
COPY cookies.json .

# Install npm dependencies (include puppeteer-extra, stealth, tesseract.js)
RUN npm install

# Dummy server port env (Render expects this)
ENV PORT=3000

# Start the bot
CMD ["node", "bypass-ptc.js"]