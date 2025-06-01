FROM node:18-slim

# Install Chromium dependencies (NOTE: ttf-freefont removed)
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    curl \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy files
COPY package.json .
COPY bypass-ptc.js .
COPY cookies.json .

# Install Node.js packages
RUN npm install

# Let Puppeteer use bundled Chromium
CMD ["node", "bypass-ptc.js"]
