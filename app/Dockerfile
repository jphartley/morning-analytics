FROM node:22-slim

WORKDIR /app

# Copy package files and install (sharp includes prebuilt libvips)
COPY package.json package-lock.json ./
RUN NODE_OPTIONS=--max-old-space-size=4096 npm install

# Copy app source
COPY . .

# Build Next.js
RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build

# Start
EXPOSE 3000
CMD ["npm", "start"]
