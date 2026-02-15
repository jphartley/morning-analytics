FROM node:22-slim

WORKDIR /app

# Install dependencies for sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install
COPY package.json package-lock.json ./
RUN npm install --production

# Copy app source
COPY . .

# Build Next.js
RUN npm run build

# Start
EXPOSE 3000
CMD ["npm", "start"]
