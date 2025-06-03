# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Copy files
COPY package*.json ./
COPY index.js ./
COPY cookies.json ./

# Install dependencies
RUN npm install

# Run app
CMD ["node", "index.js"]