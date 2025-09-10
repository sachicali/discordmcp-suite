# Docker Deployment Guide

## Overview

This guide covers deploying the MCP Discord Server using Docker containers for production environments. Docker provides consistent, scalable, and portable deployment across different environments.

## Prerequisites

- Docker 20.0 or higher
- Docker Compose 2.0 or higher
- Discord bot token
- Basic understanding of Docker concepts

## Quick Start

### 1. Clone and Build

```bash
# Clone repository
git clone https://github.com/sachicali/discordmcp-suite.git
cd mcp-discord-forum

# Build Docker image
docker build -t mcp-discord:latest .
```

### 2. Environment Configuration

Create a `.env` file:

```env
# Required Configuration
DISCORD_TOKEN=your_discord_bot_token_here
TRANSPORT=http
HTTP_PORT=3000
NODE_ENV=production

# Security Configuration (Recommended)
ALLOW_GUILD_IDS=guild_id_1,guild_id_2
ALLOW_CHANNEL_IDS=channel_id_1,channel_id_2

# Feature Flags
ENABLE_USER_MANAGEMENT=1
ENABLE_VOICE_CHANNELS=1
ENABLE_DIRECT_MESSAGES=1
ENABLE_SERVER_MANAGEMENT=1
ENABLE_RBAC=1
ENABLE_CONTENT_MANAGEMENT=1

# Monitoring (Optional)
ENABLE_HEALTH_MONITORING=1
ENABLE_METRICS_COLLECTION=1
HEALTH_CHECK_INTERVAL=30000
```

### 3. Run Container

```bash
# Run with environment file
docker run -d \
  --name mcp-discord \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  mcp-discord:latest
```

## Docker Compose Deployment

### Basic Configuration

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  mcp-discord:
    build: .
    container_name: mcp-discord
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TRANSPORT=http
      - HTTP_PORT=3000
      - NODE_ENV=production
      - ALLOW_GUILD_IDS=${ALLOW_GUILD_IDS}
      - ALLOW_CHANNEL_IDS=${ALLOW_CHANNEL_IDS}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

### Production Configuration with Monitoring

```yaml
version: "3.8"

services:
  mcp-discord:
    build: .
    container_name: mcp-discord
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TRANSPORT=http
      - HTTP_PORT=3000
      - NODE_ENV=production
      - ALLOW_GUILD_IDS=${ALLOW_GUILD_IDS}
      - ALLOW_CHANNEL_IDS=${ALLOW_CHANNEL_IDS}
      - ENABLE_HEALTH_MONITORING=1
      - ENABLE_METRICS_COLLECTION=1
      - METRICS_PORT=9090
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    networks:
      - mcp-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  # Redis for caching (optional)
  redis:
    image: redis:7-alpine
    container_name: mcp-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - mcp-network
    command: redis-server --appendonly yes

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: mcp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - mcp-discord
    networks:
      - mcp-network

  # Monitoring with Prometheus (optional)
  prometheus:
    image: prom/prometheus:latest
    container_name: mcp-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - mcp-network
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.console.libraries=/etc/prometheus/console_libraries"
      - "--web.console.templates=/etc/prometheus/consoles"

volumes:
  redis_data:
  prometheus_data:

networks:
  mcp-network:
    driver: bridge
```

### Deploy with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f mcp-discord

# Stop services
docker-compose down

# Update and restart
docker-compose build --no-cache
docker-compose up -d
```

## Advanced Configuration

### Multi-Stage Dockerfile

Create optimized `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install dependencies and build
RUN npm ci --only=production && \
    npm install -g typescript && \
    npm run build

# Production stage
FROM node:18-alpine AS production

# Add security packages
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set ownership
RUN chown -R mcp:nodejs /app
USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${HTTP_PORT:-3000}/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "build/index.js"]
```

### Environment-specific Configurations

#### Development

```yaml
# docker-compose.dev.yml
version: "3.8"

services:
  mcp-discord:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: mcp-discord-dev
    ports:
      - "3000:3000"
      - "9229:9229" # Debug port
    environment:
      - NODE_ENV=development
      - DEBUG=mcp-discord:*
    volumes:
      - ./src:/app/src
      - ./tsconfig.json:/app/tsconfig.json
    command: npm run dev
```

#### Staging

```yaml
# docker-compose.staging.yml
version: "3.8"

services:
  mcp-discord:
    image: mcp-discord:staging
    container_name: mcp-discord-staging
    environment:
      - NODE_ENV=staging
      - DISCORD_TOKEN=${STAGING_DISCORD_TOKEN}
      - ALLOW_GUILD_IDS=${STAGING_GUILD_IDS}
    networks:
      - staging-network
```

## Kubernetes Deployment

### Basic Kubernetes Configuration

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-discord
  labels:
    app: mcp-discord
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mcp-discord
  template:
    metadata:
      labels:
        app: mcp-discord
    spec:
      containers:
        - name: mcp-discord
          image: mcp-discord:latest
          ports:
            - containerPort: 3000
          env:
            - name: DISCORD_TOKEN
              valueFrom:
                secretKeyRef:
                  name: discord-secrets
                  key: token
            - name: TRANSPORT
              value: "http"
            - name: HTTP_PORT
              value: "3000"
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-discord-service
spec:
  selector:
    app: mcp-discord
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: Secret
metadata:
  name: discord-secrets
type: Opaque
data:
  token: <base64-encoded-discord-token>
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace mcp-discord

# Deploy secrets
kubectl create secret generic discord-secrets \
  --from-literal=token=your_discord_token \
  -n mcp-discord

# Deploy application
kubectl apply -f k8s-deployment.yaml -n mcp-discord

# Check deployment
kubectl get pods -n mcp-discord
kubectl logs -f deployment/mcp-discord -n mcp-discord
```

## Monitoring and Logging

### Logging Configuration

```yaml
# docker-compose with logging
version: '3.8'

services:
  mcp-discord:
    # ... other config
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=mcp-discord"

    # Or use external logging
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://logstash:5000"
        tag: "mcp-discord"
```

### Prometheus Metrics

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "mcp-discord"
    static_configs:
      - targets: ["mcp-discord:9090"]
    scrape_interval: 10s
    metrics_path: "/metrics"

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

### Health Monitoring

```bash
# Monitor container health
docker stats mcp-discord

# Check logs
docker logs -f mcp-discord

# Execute health check manually
docker exec mcp-discord curl -f http://localhost:3000/health
```

## Security Best Practices

### 1. Use Non-Root User

```dockerfile
# In Dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001
USER mcp
```

### 2. Secrets Management

```bash
# Use Docker secrets
echo "your_discord_token" | docker secret create discord_token -

# In docker-compose.yml
secrets:
  discord_token:
    external: true

services:
  mcp-discord:
    secrets:
      - discord_token
    environment:
      - DISCORD_TOKEN_FILE=/run/secrets/discord_token
```

### 3. Network Security

```yaml
# Restrict network access
networks:
  mcp-internal:
    driver: bridge
    internal: true
  mcp-external:
    driver: bridge

services:
  mcp-discord:
    networks:
      - mcp-internal
      - mcp-external
```

### 4. Resource Limits

```yaml
services:
  mcp-discord:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"
```

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs
docker logs mcp-discord

# Check configuration
docker exec mcp-discord env | grep DISCORD

# Test connectivity
docker exec mcp-discord curl -f http://localhost:3000/health
```

#### Out of Memory

```bash
# Check memory usage
docker stats mcp-discord

# Increase memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

#### Permission Denied

```bash
# Check file ownership
docker exec mcp-discord ls -la /app

# Fix permissions in Dockerfile
RUN chown -R mcp:nodejs /app
```

### Debug Mode

```yaml
# docker-compose.debug.yml
services:
  mcp-discord:
    environment:
      - DEBUG=mcp-discord:*
      - NODE_ENV=development
    command: ["node", "--inspect=0.0.0.0:9229", "build/index.js"]
    ports:
      - "9229:9229"
```

## Backup and Recovery

### Data Backup

```bash
# Backup logs and data
docker cp mcp-discord:/app/logs ./backup/logs
docker cp mcp-discord:/app/data ./backup/data

# Backup with volumes
docker run --rm \
  -v mcp_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/data-backup.tar.gz -C /data .
```

### Configuration Backup

```bash
# Export environment
docker exec mcp-discord env > backup/environment.txt

# Backup compose files
cp docker-compose.yml backup/
cp .env backup/env.backup
```

### Recovery

```bash
# Restore data
docker run --rm \
  -v mcp_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/data-backup.tar.gz -C /data

# Recreate containers
docker-compose down
docker-compose up -d
```

## Scaling and High Availability

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  mcp-discord:
    # ... config
    deploy:
      replicas: 3

  nginx:
    # Load balancer config
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
```

### Load Balancing

Create `nginx-lb.conf`:

```nginx
upstream mcp_backend {
    server mcp-discord-1:3000;
    server mcp-discord-2:3000;
    server mcp-discord-3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://mcp_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

This deployment guide provides comprehensive Docker-based deployment options for the MCP Discord Server, from simple single-container setups to complex multi-service production deployments with monitoring and scaling capabilities.
