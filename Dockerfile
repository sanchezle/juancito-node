# Stage 1: Dependencies
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production
FROM node:18-alpine AS production

# Install PM2 globally
RUN npm install pm2 -g

# Create a non-root user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory and copy dependencies from builder stage
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

# Switch to non-root user
USER appuser

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create healthcheck endpoint
COPY healthcheck.js ./
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js

# Expose the container port
EXPOSE 5000

# Use PM2 to run the application with the ecosystem.config.js file
CMD ["pm2-runtime", "ecosystem.config.js"]