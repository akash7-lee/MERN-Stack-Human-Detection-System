# Multi-stage Dockerfile for MERN Stack Human Detection System

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/src ./src
COPY frontend/public ./public

# Build the React application
RUN npm run build

# Stage 2: Backend and production image
FROM node:18-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy backend files
COPY backend/package.json backend/package-lock.json* ./

# Install backend dependencies
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/build ./public

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init to run Node
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
