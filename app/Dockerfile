FROM node:22-slim AS base

# Install bun for faster, more memory-efficient installs
RUN npm install -g bun

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Use bun to install (much lower memory than npm)
RUN bun install

# Copy app source
COPY . .

# Build Next.js (uses Node, not bun)
RUN npm run build

# Start
EXPOSE 3000
CMD ["npm", "start"]
