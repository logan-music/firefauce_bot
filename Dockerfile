FROM node:18-slim

# Install Chromium dependencies (NOT chromium browser itself)
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    ttf-freefont \
    curl \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy files
COPY package.json .
COPY bypass-ptc.js .
COPY cookies.json .

# Install Node packages (this will also download Chromium automatically)
RUN npm install

# No need to set PUPPETEER_EXECUTABLE_PATH (it will use default)
CMD ["node", "bypass-ptc.js"]
