import { z } from "zod";
import { info, error } from "./logger.js";

// Configuration schema for validation
export const ServerConfigSchema = z.object({
  DISCORD_TOKEN: z.string().nullable(),
  ALLOW_GUILD_IDS: z.array(z.string()),
  ALLOW_CHANNEL_IDS: z.array(z.string()),
  ENABLE_USER_MANAGEMENT: z.boolean(),
  ENABLE_VOICE_CHANNELS: z.boolean(),
  ENABLE_DIRECT_MESSAGES: z.boolean(),
  ENABLE_SERVER_MANAGEMENT: z.boolean(),
  ENABLE_RBAC: z.boolean(),
  ENABLE_CONTENT_MANAGEMENT: z.boolean(),
  TRANSPORT: z.enum(["stdio", "http"]),
  HTTP_PORT: z.number().min(1).max(65535),
  HEALTH_CHECK_ENABLED: z.boolean(),
  CONFIG_ENDPOINT_ENABLED: z.boolean(),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// Configuration validation and management
export class ConfigManager {
  private config: ServerConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): ServerConfig {
    const config: ServerConfig = {
      DISCORD_TOKEN: (() => {
        // Priority: command line > environment > null
        const configIndex = process.argv.indexOf("--config");
        if (configIndex !== -1 && configIndex + 1 < process.argv.length) {
          const configArg = process.argv[configIndex + 1];
          if (typeof configArg === "string") {
            try {
              const parsedConfig = JSON.parse(configArg);
              return parsedConfig.DISCORD_TOKEN || parsedConfig.token || null;
            } catch (err) {
              return configArg;
            }
          }
        }
        return process.env.DISCORD_TOKEN || null;
      })(),

      ALLOW_GUILD_IDS: (() => {
        const guilds = process.env.ALLOW_GUILD_IDS || "";
        return guilds
          ? guilds
              .split(",")
              .map((g) => g.trim())
              .filter((g) => g.length > 0)
          : [];
      })(),

      ALLOW_CHANNEL_IDS: (() => {
        const channels = process.env.ALLOW_CHANNEL_IDS || "";
        return channels
          ? channels
              .split(",")
              .map((c) => c.trim())
              .filter((c) => c.length > 0)
          : [];
      })(),

      ENABLE_USER_MANAGEMENT: this.parseBoolean(
        process.env.ENABLE_USER_MANAGEMENT,
      ),
      ENABLE_VOICE_CHANNELS: this.parseBoolean(
        process.env.ENABLE_VOICE_CHANNELS,
      ),
      ENABLE_DIRECT_MESSAGES: this.parseBoolean(
        process.env.ENABLE_DIRECT_MESSAGES,
      ),
      ENABLE_SERVER_MANAGEMENT: this.parseBoolean(
        process.env.ENABLE_SERVER_MANAGEMENT,
      ),
      ENABLE_RBAC: this.parseBoolean(process.env.ENABLE_RBAC),
      ENABLE_CONTENT_MANAGEMENT: this.parseBoolean(
        process.env.ENABLE_CONTENT_MANAGEMENT,
      ),

      TRANSPORT: (() => {
        const transportIndex = process.argv.indexOf("--transport");
        if (transportIndex !== -1 && transportIndex + 1 < process.argv.length) {
          const transport = process.argv[transportIndex + 1];
          if (transport === "http" || transport === "stdio") {
            return transport as "http" | "stdio";
          }
        }
        return (process.env.TRANSPORT === "http" ? "http" : "stdio") as
          | "http"
          | "stdio";
      })(),

      HTTP_PORT: (() => {
        const portIndex = process.argv.indexOf("--port");
        if (portIndex !== -1 && portIndex + 1 < process.argv.length) {
          const port = parseInt(process.argv[portIndex + 1]);
          if (!isNaN(port) && port > 0 && port <= 65535) {
            return port;
          }
        }
        const envPort = parseInt(
          process.env.PORT || process.env.HTTP_PORT || "8080",
        );
        return isNaN(envPort) ? 8080 : Math.max(1, Math.min(65535, envPort));
      })(),

      HEALTH_CHECK_ENABLED: this.parseBoolean(
        process.env.HEALTH_CHECK_ENABLED,
        true,
      ),
      CONFIG_ENDPOINT_ENABLED: this.parseBoolean(
        process.env.CONFIG_ENDPOINT_ENABLED,
        true,
      ),
    };

    return config;
  }

  private parseBoolean(
    value: string | undefined,
    defaultValue: boolean = false,
  ): boolean {
    if (!value) return defaultValue;
    return value === "1" || value.toLowerCase() === "true";
  }

  private validateConfig(): void {
    try {
      this.config = ServerConfigSchema.parse(this.config);
      info("Configuration validation successful");
    } catch (err) {
      error(`Configuration validation failed: ${err}`);
      throw err;
    }
  }

  public getConfig(): ServerConfig {
    return { ...this.config };
  }

  public getConfigSummary(): Record<string, any> {
    const summary = { ...this.config };

    // Mask sensitive information
    if (summary.DISCORD_TOKEN) {
      summary.DISCORD_TOKEN = summary.DISCORD_TOKEN.substring(0, 10) + "...";
    }

    return summary;
  }

  public isConfigured(): boolean {
    return !!this.config.DISCORD_TOKEN;
  }

  public getMissingRequirements(): string[] {
    const missing: string[] = [];

    if (!this.config.DISCORD_TOKEN) {
      missing.push("DISCORD_TOKEN - Required for Discord authentication");
    }

    // Check for feature-specific requirements
    if (this.config.ENABLE_USER_MANAGEMENT) {
      missing.push(
        "Bot permissions: Kick Members, Ban Members, Moderate Members, Manage Roles",
      );
    }

    if (this.config.ENABLE_VOICE_CHANNELS) {
      missing.push("Bot permissions: Connect, Speak, Move Members");
    }

    if (this.config.ENABLE_SERVER_MANAGEMENT) {
      missing.push(
        "Bot permissions: Manage Emojis and Stickers, Manage Guild, View Audit Log",
      );
    }

    return missing;
  }

  public getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    checks: Record<string, boolean>;
    details: string[];
  } {
    const checks: Record<string, boolean> = {
      token_configured: !!this.config.DISCORD_TOKEN,
      transport_valid: ["stdio", "http"].includes(this.config.TRANSPORT),
      port_valid: this.config.HTTP_PORT > 0 && this.config.HTTP_PORT <= 65535,
    };

    const details: string[] = [];

    if (!checks.token_configured) {
      details.push("Discord token not configured");
    }

    if (!checks.transport_valid) {
      details.push(`Invalid transport: ${this.config.TRANSPORT}`);
    }

    if (!checks.port_valid) {
      details.push(`Invalid port: ${this.config.HTTP_PORT}`);
    }

    const allHealthy = Object.values(checks).every((check) => check);
    const status = allHealthy
      ? "healthy"
      : Object.values(checks).some((check) => check)
        ? "degraded"
        : "unhealthy";

    return { status, checks, details };
  }

  public updateToken(token: string): void {
    if (!token || typeof token !== "string") {
      throw new Error("Invalid token provided");
    }

    this.config.DISCORD_TOKEN = token;
    info("Discord token updated successfully");
  }

  public resetToken(): void {
    this.config.DISCORD_TOKEN = null;
    info("Discord token has been reset");
  }
}

// Singleton instance
export const configManager = new ConfigManager();
