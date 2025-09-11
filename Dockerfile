# FastMCP Cloud Deployable Discord MCP Server
FROM node:lts-alpine

# Install dumb-init, wget for health checks, and Bun as package manager
RUN apk add --no-cache dumb-init wget && \
    wget -q https://bun.sh/install -O install.sh && \
    chmod +x install.sh && \
    ./install.sh && \
    rm install.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install all dependencies (including dev dependencies for build)
RUN ~/.bun/bin/bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript code
RUN ~/.bun/bin/bun run build

# Remove dev dependencies and clean cache
RUN ~/.bun/bin/bun install --frozen-lockfile --production

# Change ownership to non-root user
RUN chown -R mcpuser:nodejs /app
USER mcpuser

# Add bun to PATH for runtime
ENV PATH="/home/mcpuser/.bun/bin:$PATH"

# Add simple health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Expose HTTP port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command to run the MCP server with fast startup
CMD ["node", "build/fast-start.js"]