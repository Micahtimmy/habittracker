# --- Stage 1: Build React Frontend ---
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/streakkeeper.db

# Copy server dependencies and install production only
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server application code
COPY server/src ./src

# Copy built frontend assets from builder stage
COPY --from=client-builder /app/client/dist /app/client/dist

# Install su-exec for safe privilege dropping
RUN apk add --no-cache su-exec

# Copy entrypoint script and set permissions
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create persistent data directory for SQLite and set initial ownership
RUN mkdir -p /data && chown -R node:node /data /app

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
