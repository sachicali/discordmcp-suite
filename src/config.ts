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

        // Check environment variable (primary method)
        const envToken = process.env.DISCORD_TOKEN;
        if (envToken) {
          info(
            `Discord token found in environment variables (length: ${envToken.length})`,
          );
          return envToken;
        }

        // Check for Smithery.ai configuration parameters (fallback)
        // Smithery.ai might pass config as different environment variables
        const smitheryToken =
          process.env.discordToken ||
          process.env.DISCORDTOKEN ||
          process.env.token ||
          process.env.BOT_TOKEN ||
          process.env.DISCORD_BOT_TOKEN ||
          process.env.config_discordToken;
        if (smitheryToken) {
          info(
            `Discord token found via Smithery.ai config (length: ${smitheryToken.length})`,
          );
          return smitheryToken;
        }

        // Log available environment variables for debugging (without sensitive values)
        const envVars = Object.keys(process.env).filter(
          (key) =>
            key.toLowerCase().includes("discord") ||
            key.toLowerCase().includes("token"),
        );
        if (envVars.length > 0) {
          info(
            `Available Discord-related environment variables: ${envVars.join(", ")}`,
          );
          // Log the values (masked) for debugging
          envVars.forEach((key) => {
            const value = process.env[key];
            if (value) {
              const masked =
                value.length > 10 ? value.substring(0, 10) + "..." : value;
              info(`  ${key}: ${masked} (length: ${value.length})`);
            }
          });
        } else {
          info("No Discord-related environment variables found");
        }

        // Debug: Log DEBUG_TOKEN if present
        if (process.env.DEBUG_TOKEN) {
          info(`DEBUG_TOKEN is set to: ${process.env.DEBUG_TOKEN}`);
          // Log ALL environment variables for debugging (in deployed environments only)
          if (
            process.env.NODE_ENV === "production" ||
            process.env.DEBUG_TOKEN === "true"
          ) {
            info("=== ALL ENVIRONMENT VARIABLES (for debugging) ===");
            Object.keys(process.env)
              .sort()
              .forEach((key) => {
                const value = process.env[key];
                if (value) {
                  const masked =
                    key.toLowerCase().includes("token") ||
                    key.toLowerCase().includes("secret")
                      ? value.length > 10
                        ? value.substring(0, 10) + "..."
                        : value
                      : value;
                  info(`  ${key}: ${masked}`);
                }
              });
            info("=== END ENVIRONMENT VARIABLES ===");
          }
        }

        return null;
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

      ENABLE_USER_MANAGEMENT: (() => {
        // Check multiple environment variable formats for Smithery compatibility
        const envValue =
          process.env.ENABLE_USER_MANAGEMENT ||
          process.env.enableUserManagement ||
          process.env.USER_MANAGEMENT ||
          process.env.enable_user_management ||
          process.env.user_management;

        // Handle Smithery boolean conversion issues
        if (
          envValue === "false" ||
          envValue === "0" ||
          envValue === "no" ||
          envValue === "off"
        ) {
          return false;
        }
        if (
          envValue === "true" ||
          envValue === "1" ||
          envValue === "yes" ||
          envValue === "on"
        ) {
          return true;
        }

        const value = this.parseBoolean(envValue, false); // Default to disabled
        if (process.env.DEBUG_TOKEN) {
          info(`ENABLE_USER_MANAGEMENT: env="${envValue}" -> ${value}`);
        }
        return value;
      })(),
      ENABLE_VOICE_CHANNELS: (() => {
        // Check multiple environment variable formats for Smithery compatibility
        const envValue =
          process.env.ENABLE_VOICE_CHANNELS ||
          process.env.enableVoiceChannels ||
          process.env.VOICE_CHANNELS ||
          process.env.enable_voice_channels ||
          process.env.voice_channels;

        // Handle Smithery boolean conversion issues
        if (
          envValue === "false" ||
          envValue === "0" ||
          envValue === "no" ||
          envValue === "off"
        ) {
          return false;
        }
        if (
          envValue === "true" ||
          envValue === "1" ||
          envValue === "yes" ||
          envValue === "on"
        ) {
          return true;
        }

        const value = this.parseBoolean(envValue, false); // Default to disabled
        if (process.env.DEBUG_TOKEN) {
          info(`ENABLE_VOICE_CHANNELS: env="${envValue}" -> ${value}`);
        }
        return value;
      })(),
      ENABLE_DIRECT_MESSAGES: (() => {
        // Check multiple environment variable formats for Smithery compatibility
        const envValue =
          process.env.ENABLE_DIRECT_MESSAGES ||
          process.env.enableDirectMessages ||
          process.env.DIRECT_MESSAGES ||
          process.env.enable_direct_messages ||
          process.env.direct_messages;

        // Handle Smithery boolean conversion issues
        if (
          envValue === "false" ||
          envValue === "0" ||
          envValue === "no" ||
          envValue === "off"
        ) {
          return false;
        }
        if (
          envValue === "true" ||
          envValue === "1" ||
          envValue === "yes" ||
          envValue === "on"
        ) {
          return true;
        }

        const value = this.parseBoolean(envValue, false); // Default to disabled
        if (process.env.DEBUG_TOKEN) {
          info(`ENABLE_DIRECT_MESSAGES: env="${envValue}" -> ${value}`);
        }
        return value;
      })(),
      ENABLE_SERVER_MANAGEMENT: (() => {
        // Check multiple environment variable formats for Smithery compatibility
        const envValue =
          process.env.ENABLE_SERVER_MANAGEMENT ||
          process.env.enableServerManagement ||
          process.env.SERVER_MANAGEMENT ||
          process.env.enable_server_management ||
          process.env.server_management;

        // Handle Smithery boolean conversion issues
        if (
          envValue === "false" ||
          envValue === "0" ||
          envValue === "no" ||
          envValue === "off"
        ) {
          return false;
        }
        if (
          envValue === "true" ||
          envValue === "1" ||
          envValue === "yes" ||
          envValue === "on"
        ) {
          return true;
        }

        const value = this.parseBoolean(envValue, false); // Default to disabled
        if (process.env.DEBUG_TOKEN) {
          info(`ENABLE_SERVER_MANAGEMENT: env="${envValue}" -> ${value}`);
        }
        return value;
      })(),
      ENABLE_RBAC: (() => {
        // Check multiple environment variable formats for Smithery compatibility
        const envValue =
          process.env.ENABLE_RBAC ||
          process.env.enableRbac ||
          process.env.RBAC ||
          process.env.enable_rbac ||
          process.env.rbac;

        // Handle Smithery boolean conversion issues
        if (
          envValue === "false" ||
          envValue === "0" ||
          envValue === "no" ||
          envValue === "off"
        ) {
          return false;
        }
        if (
          envValue === "true" ||
          envValue === "1" ||
          envValue === "yes" ||
          envValue === "on"
        ) {
          return true;
        }

        const value = this.parseBoolean(envValue, false); // Default to disabled
        if (process.env.DEBUG_TOKEN) {
          info(`ENABLE_RBAC: env="${envValue}" -> ${value}`);
        }
        return value;
      })(),
      ENABLE_CONTENT_MANAGEMENT: (() => {
        // Check multiple environment variable formats for Smithery compatibility
        const envValue =
          process.env.ENABLE_CONTENT_MANAGEMENT ||
          process.env.enableContentManagement ||
          process.env.CONTENT_MANAGEMENT ||
          process.env.enable_content_management ||
          process.env.content_management;

        // Handle Smithery boolean conversion issues
        if (
          envValue === "false" ||
          envValue === "0" ||
          envValue === "no" ||
          envValue === "off"
        ) {
          return false;
        }
        if (
          envValue === "true" ||
          envValue === "1" ||
          envValue === "yes" ||
          envValue === "on"
        ) {
          return true;
        }

        const value = this.parseBoolean(envValue, false); // Default to disabled
        if (process.env.DEBUG_TOKEN) {
          info(`ENABLE_CONTENT_MANAGEMENT: env="${envValue}" -> ${value}`);
        }
        return value;
      })(),

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
    // Log for debugging Smithery environment variables
    if (process.env.DEBUG_TOKEN) {
      info(`parseBoolean: value="${value}", default=${defaultValue}`);
    }

    if (!value || value === "") {
      if (process.env.DEBUG_TOKEN) {
        info(`parseBoolean: empty value, returning default: ${defaultValue}`);
      }
      return defaultValue;
    }

    // Handle explicit false values for Smithery compatibility
    const lowerValue = value.toLowerCase().trim();
    if (
      lowerValue === "false" ||
      lowerValue === "0" ||
      lowerValue === "no" ||
      lowerValue === "off" ||
      lowerValue === "disabled" ||
      lowerValue === "disable"
    ) {
      if (process.env.DEBUG_TOKEN) {
        info(`parseBoolean: detected false value "${lowerValue}"`);
      }
      return false;
    }

    // Handle explicit true values
    if (
      lowerValue === "true" ||
      lowerValue === "1" ||
      lowerValue === "yes" ||
      lowerValue === "on" ||
      lowerValue === "enabled" ||
      lowerValue === "enable"
    ) {
      if (process.env.DEBUG_TOKEN) {
        info(`parseBoolean: detected true value "${lowerValue}"`);
      }
      return true;
    }

    // For any other value, return the default
    if (process.env.DEBUG_TOKEN) {
      info(
        `parseBoolean: unknown value "${lowerValue}", returning default: ${defaultValue}`,
      );
    }
    return defaultValue;
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

    // Check for cloud deployment requirements
    if (process.env.NODE_ENV === "production") {
      if (!this.config.DISCORD_TOKEN) {
        missing.push("CRITICAL: DISCORD_TOKEN must be set in production");
      }
      if (!process.env.PORT && !process.env.HTTP_PORT) {
        missing.push("PORT or HTTP_PORT should be set for cloud deployment");
      }
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
