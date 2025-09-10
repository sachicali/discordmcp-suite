# FastMCP Cloud Deployable Discord MCP Server
FROM node:lts-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies and clean cache
RUN npm prune --production && \
    npm cache clean --force

# Change ownership to non-root user
RUN chown -R mcpuser:nodejs /app
USER mcpuser

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose HTTP port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command to run the MCP server with HTTP transport
CMD ["sh", "-c", "node validate-env.js && node build/index.js --transport http --port 8080"]