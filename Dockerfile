# Build stage
FROM node:18-alpine AS builder

# Install Appwrite CLI
RUN npm install -g appwrite-cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install Appwrite CLI in production image
RUN npm install -g appwrite-cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static

# Copy necessary config files
COPY svelte.config.js ./
COPY vite.config.ts ./
COPY appwrite.json ./
COPY deploy_appwrite.sh ./
# RUN chmod +x /deploy_appwrite.sh

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "build"]