# Production Dockerfile for IoT Weather Monitoring Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Environment setup
ENV NODE_ENV=production
ENV PORT=5001
ENV HOST=0.0.0.0

EXPOSE 5001

# Health check against live endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5001/health || exit 1

CMD ["node", "src/index.js"]
