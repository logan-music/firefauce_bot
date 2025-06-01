FROM node:18-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
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

# Copy source files
COPY package.json .
COPY bypass-ptc.js .
COPY cookies.json .

# Install dependencies
RUN npm install

# Start the bot
CMD ["node", "bypass-ptc.js"]
