# MCP Discord Server - Best Practices Guide

## Development Best Practices

### Code Organization

#### File Structure

```
src/
├── services/          # Business logic services
│   ├── errorHandling.ts
│   ├── healthMonitoring.ts
│   ├── bulkOperations.ts
│   └── securityAudit.ts
├── tools/             # MCP tool implementations
│   ├── login.ts
│   ├── channel.ts
│   ├── forum.ts
│   └── ...
├── types/             # Type definitions
└── utils/             # Utility functions
```

#### Module Exports

```typescript
// Use named exports
export { UserService } from "./userService.js";
export { MessageHandler } from "./messageHandler.js";

// Avoid default exports
// ❌ export default class UserService
// ✅ export class UserService
```

#### Import Organization

```typescript
// 1. Node.js built-ins
import { EventEmitter } from "events";
import fs from "fs/promises";

// 2. Third-party packages
import { Client, Guild } from "discord.js";
import { z } from "zod";

// 3. Internal modules
import { logger } from "../logger.js";
import { handleError } from "../errorHandler.js";
```

### Type Safety

#### Strict TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Input Validation with Zod

```typescript
import { z } from "zod";

const CreateChannelSchema = z.object({
  guild_id: z.string().regex(/^\d{17,19}$/),
  name: z.string().min(1).max(100),
  type: z.enum(["GUILD_TEXT", "GUILD_VOICE", "GUILD_FORUM"]),
  parent_id: z
    .string()
    .regex(/^\d{17,19}$/)
    .optional(),
});

export async function createChannelHandler(args: any, context: ToolContext) {
  const validated = CreateChannelSchema.parse(args);
  // Implementation with type-safe validated input
}
```

#### Return Type Consistency

```typescript
// Consistent response interface
interface ToolResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Always use this format
export async function toolHandler(args: any): Promise<ToolResponse> {
  try {
    const result = await performOperation(args);
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: {
        code: "OPERATION_FAILED",
        message: err.message,
        details: err.details,
      },
    };
  }
}
```

### Error Handling

#### Comprehensive Error Handling

```typescript
import { handleDiscordError } from "../errorHandler.js";

export async function discordOperation(client: Client, guildId: string) {
  try {
    const guild = await client.guilds.fetch(guildId);
    return { success: true, guild };
  } catch (error) {
    return handleDiscordError(error, {
      operation: "fetch_guild",
      guild_id: guildId,
      context: "discordOperation",
    });
  }
}
```

#### Error Categories

```typescript
enum ErrorCategory {
  VALIDATION = "validation",
  PERMISSION = "permission",
  NOT_FOUND = "not_found",
  RATE_LIMIT = "rate_limit",
  NETWORK = "network",
  INTERNAL = "internal",
}

function categorizeError(error: any): ErrorCategory {
  if (error.code === 50013) return ErrorCategory.PERMISSION;
  if (error.code === 10004) return ErrorCategory.NOT_FOUND;
  if (error.code === 429) return ErrorCategory.RATE_LIMIT;
  // ... more categorization logic
  return ErrorCategory.INTERNAL;
}
```

### Performance Optimization

#### Efficient Data Fetching

```typescript
// ❌ Inefficient - multiple API calls
async function getUserRoles(guild: Guild, userIds: string[]) {
  const results = [];
  for (const userId of userIds) {
    const member = await guild.members.fetch(userId);
    results.push({ userId, roles: member.roles.cache.map((r) => r.name) });
  }
  return results;
}

// ✅ Efficient - bulk fetch
async function getUserRoles(guild: Guild, userIds: string[]) {
  // Fetch all members at once if not cached
  await guild.members.fetch();

  return userIds.map((userId) => {
    const member = guild.members.cache.get(userId);
    return {
      userId,
      roles: member ? member.roles.cache.map((r) => r.name) : [],
    };
  });
}
```

#### Caching Strategy

```typescript
class CachedDiscordService {
  private guildCache = new Map<string, Guild>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getGuild(client: Client, guildId: string): Promise<Guild> {
    const cached = this.guildCache.get(guildId);
    if (cached && Date.now() - cached.fetchedTimestamp < this.cacheTimeout) {
      return cached;
    }

    const guild = await client.guilds.fetch(guildId);
    guild.fetchedTimestamp = Date.now();
    this.guildCache.set(guildId, guild);
    return guild;
  }
}
```

#### Rate Limiting

```typescript
class RateLimiter {
  private queues = new Map<string, Promise<any>[]>();

  async execute<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const queue = this.queues.get(key) || [];

    const promise =
      queue.length === 0
        ? operation()
        : queue[queue.length - 1].then(() => operation());

    queue.push(promise);
    this.queues.set(key, queue);

    // Clean up completed promises
    promise.finally(() => {
      const currentQueue = this.queues.get(key) || [];
      const index = currentQueue.indexOf(promise);
      if (index > -1) {
        currentQueue.splice(index, 1);
        if (currentQueue.length === 0) {
          this.queues.delete(key);
        }
      }
    });

    return promise;
  }
}
```

### Security Best Practices

#### Input Sanitization

```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML
    .replace(/[@#`]/g, "") // Remove Discord markdown
    .trim()
    .substring(0, 2000); // Limit length
}

function validateSnowflake(id: string): boolean {
  return /^\d{17,19}$/.test(id);
}
```

#### Permission Validation

```typescript
import { PermissionsBitField } from "discord.js";

async function validatePermissions(
  member: GuildMember,
  required: bigint[],
): Promise<{ valid: boolean; missing: string[] }> {
  const missing = [];

  for (const permission of required) {
    if (!member.permissions.has(permission)) {
      missing.push(new PermissionsBitField(permission).toArray()[0]);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Usage
const { valid, missing } = await validatePermissions(member, [
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.ManageRoles,
]);

if (!valid) {
  return {
    success: false,
    error: {
      code: "INSUFFICIENT_PERMISSIONS",
      message: `Missing permissions: ${missing.join(", ")}`,
    },
  };
}
```

#### Secure Configuration

```typescript
// Environment variable validation
const CONFIG_SCHEMA = z.object({
  DISCORD_TOKEN: z.string().min(50),
  ALLOW_GUILD_IDS: z.string().optional(),
  ALLOW_CHANNEL_IDS: z.string().optional(),
  HTTP_PORT: z.string().regex(/^\d+$/).default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const config = CONFIG_SCHEMA.parse(process.env);

// Guild/Channel allowlisting
function isGuildAllowed(guildId: string): boolean {
  if (!config.ALLOW_GUILD_IDS) return true;
  return config.ALLOW_GUILD_IDS.split(",").includes(guildId);
}

function isChannelAllowed(channelId: string): boolean {
  if (!config.ALLOW_CHANNEL_IDS) return true;
  return config.ALLOW_CHANNEL_IDS.split(",").includes(channelId);
}
```

### Testing Strategies

#### Unit Tests

```typescript
// __tests__/userService.test.ts
import { describe, it, expect, jest } from "@jest/globals";
import { UserService } from "../src/services/userService.js";

describe("UserService", () => {
  it("should fetch user data correctly", async () => {
    const mockClient = {
      users: {
        fetch: jest.fn().mockResolvedValue({
          id: "123456789",
          username: "testuser",
          discriminator: "1234",
        }),
      },
    };

    const userService = new UserService(mockClient as any);
    const result = await userService.getUser("123456789");

    expect(result).toEqual({
      id: "123456789",
      username: "testuser",
      discriminator: "1234",
    });
  });
});
```

#### Integration Tests

```typescript
// __tests__/integration/discord-api.test.ts
import { Client } from "discord.js";
import { config } from "../src/config.js";

describe("Discord API Integration", () => {
  let client: Client;

  beforeAll(async () => {
    if (!config.TEST_DISCORD_TOKEN) {
      throw new Error("TEST_DISCORD_TOKEN required for integration tests");
    }

    client = new Client({ intents: [] });
    await client.login(config.TEST_DISCORD_TOKEN);
  });

  afterAll(async () => {
    await client.destroy();
  });

  it("should connect to Discord successfully", () => {
    expect(client.isReady()).toBe(true);
    expect(client.user).toBeTruthy();
  });
});
```

#### End-to-End Tests

```typescript
// __tests__/e2e/tool-execution.test.ts
import { MCPServer } from "../src/server.js";
import { Client } from "discord.js";

describe("Tool Execution E2E", () => {
  let server: MCPServer;
  let client: Client;

  beforeAll(async () => {
    client = new Client({ intents: [] });
    server = new MCPServer(client);
    await server.start();
  });

  it("should execute discord_health_check tool", async () => {
    const response = await server.callTool("discord_health_check", {});

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty("status");
    expect(response.data.status).toBe("healthy");
  });
});
```

### Monitoring and Observability

#### Structured Logging

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Usage
logger.info("Tool executed successfully", {
  tool: "discord_send_message",
  channel_id: "123456789",
  user_id: "987654321",
  message_length: 50,
});

logger.error("Tool execution failed", {
  tool: "discord_create_channel",
  error: error.message,
  guild_id: "123456789",
  stack: error.stack,
});
```

#### Metrics Collection

```typescript
class MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  incrementCounter(name: string, value: number = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) + value);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  recordHistogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
  }

  getMetrics(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg:
              values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0,
            min: values.length > 0 ? Math.min(...values) : 0,
            max: values.length > 0 ? Math.max(...values) : 0,
          },
        ]),
      ),
    };
  }
}

// Usage
const metrics = new MetricsCollector();

async function executeToolWithMetrics(
  toolName: string,
  operation: () => Promise<any>,
) {
  const startTime = Date.now();

  try {
    metrics.incrementCounter(`tool_execution_total`);
    metrics.incrementCounter(`tool_execution_${toolName}`);

    const result = await operation();

    metrics.incrementCounter(`tool_execution_success`);
    metrics.recordHistogram(
      `tool_execution_duration_ms`,
      Date.now() - startTime,
    );

    return result;
  } catch (error) {
    metrics.incrementCounter(`tool_execution_error`);
    metrics.incrementCounter(`tool_execution_error_${toolName}`);
    throw error;
  }
}
```

### Configuration Management

#### Environment-based Configuration

```typescript
// config/index.ts
import { z } from "zod";

const configSchema = z.object({
  // Core configuration
  discord: z.object({
    token: z.string().min(50),
    clientId: z.string().optional(),
  }),

  // Server configuration
  server: z.object({
    port: z.number().min(1).max(65535).default(3000),
    host: z.string().default("localhost"),
    transport: z.enum(["http", "stdio"]).default("stdio"),
  }),

  // Security configuration
  security: z.object({
    allowedGuilds: z.array(z.string()).optional(),
    allowedChannels: z.array(z.string()).optional(),
    requireAuth: z.boolean().default(false),
  }),

  // Feature flags
  features: z.object({
    userManagement: z.boolean().default(true),
    voiceChannels: z.boolean().default(true),
    directMessages: z.boolean().default(true),
    serverManagement: z.boolean().default(true),
    bulkOperations: z.boolean().default(true),
  }),

  // Monitoring configuration
  monitoring: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().min(1000).default(30000),
    metricsPort: z.number().min(1).max(65535).default(9090),
  }),
});

// Load configuration from environment
function loadConfig() {
  return configSchema.parse({
    discord: {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
    },
    server: {
      port: parseInt(process.env.HTTP_PORT || "3000"),
      host: process.env.HTTP_HOST || "localhost",
      transport: process.env.TRANSPORT || "stdio",
    },
    security: {
      allowedGuilds: process.env.ALLOW_GUILD_IDS?.split(","),
      allowedChannels: process.env.ALLOW_CHANNEL_IDS?.split(","),
      requireAuth: process.env.REQUIRE_AUTH === "true",
    },
    features: {
      userManagement: process.env.ENABLE_USER_MANAGEMENT !== "false",
      voiceChannels: process.env.ENABLE_VOICE_CHANNELS !== "false",
      directMessages: process.env.ENABLE_DIRECT_MESSAGES !== "false",
      serverManagement: process.env.ENABLE_SERVER_MANAGEMENT !== "false",
      bulkOperations: process.env.ENABLE_BULK_OPERATIONS !== "false",
    },
    monitoring: {
      enabled: process.env.ENABLE_MONITORING !== "false",
      interval: parseInt(process.env.MONITORING_INTERVAL || "30000"),
      metricsPort: parseInt(process.env.METRICS_PORT || "9090"),
    },
  });
}

export const config = loadConfig();
```

### Documentation Standards

#### JSDoc Comments

````typescript
/**
 * Creates a new Discord channel in the specified guild
 *
 * @param guildId - The Discord guild (server) ID
 * @param options - Channel creation options
 * @param options.name - The channel name (1-100 characters)
 * @param options.type - The channel type
 * @param options.parent - Optional parent category ID
 * @param options.topic - Optional channel topic/description
 *
 * @returns Promise resolving to channel creation result
 *
 * @throws {ValidationError} When input parameters are invalid
 * @throws {PermissionError} When bot lacks required permissions
 * @throws {NotFoundError} When guild or parent category not found
 *
 * @example
 * ```typescript
 * const result = await createChannel('123456789', {
 *   name: 'general-chat',
 *   type: 'GUILD_TEXT',
 *   topic: 'General discussion channel'
 * });
 * ```
 */
export async function createChannel(
  guildId: string,
  options: ChannelCreateOptions,
): Promise<ChannelCreateResult> {
  // Implementation
}
````

#### API Documentation

Always maintain comprehensive API documentation including:

- Tool descriptions and parameters
- Example requests and responses
- Error codes and handling
- Rate limiting information
- Security considerations

### Deployment Best Practices

#### Environment Separation

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mcp-discord:
    image: mcp-discord:latest
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=warn
      - ENABLE_DEBUG=false
    restart: unless-stopped

# docker-compose.dev.yml
version: '3.8'
services:
  mcp-discord:
    build: .
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      - ENABLE_DEBUG=true
    volumes:
      - ./src:/app/src
```

#### Health Checks

```typescript
// Comprehensive health check
export async function healthCheck(): Promise<HealthStatus> {
  const checks = {
    discord: await checkDiscordConnection(),
    database: await checkDatabaseConnection(),
    memory: checkMemoryUsage(),
    disk: await checkDiskSpace(),
  };

  const allHealthy = Object.values(checks).every((check) => check.healthy);

  return {
    status: allHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };
}
```

#### Graceful Shutdown

```typescript
class MCPServer {
  private isShuttingDown = false;

  async start(): Promise<void> {
    // Setup signal handlers
    process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));

    // Start server
    await this.transport.start();
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);

    try {
      // Stop accepting new connections
      await this.transport.stop();

      // Wait for ongoing operations to complete
      await this.waitForOperationsToComplete();

      // Disconnect from Discord
      await this.client.destroy();

      console.log("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  }
}
```

These best practices ensure maintainable, secure, and performant Discord bot implementations that can scale effectively in production environments.
