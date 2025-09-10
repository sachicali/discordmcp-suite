import { DiscordLoginSchema } from "../schemas.js";
import { ToolHandler } from "./types.js";
import { handleDiscordError } from "../errorHandler.js";
import { info, error } from "../logger.js";
import { Client } from "discord.js";
import { configManager } from "../config.js";

// Create a function to properly wait for client to be ready
async function waitForReady(
  client: Client,
  token: string,
  timeoutMs = 30000,
): Promise<Client> {
  return new Promise((resolve, reject) => {
    // Set a timeout to prevent hanging if ready event never fires
    const timeout = setTimeout(() => {
      reject(new Error(`Client ready event timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    // If client is already ready, resolve immediately
    if (client.isReady()) {
      clearTimeout(timeout);
      resolve(client);
      return;
    }

    // Listen for ready event
    const readyHandler = () => {
      info("Client ready event received");
      clearTimeout(timeout);
      resolve(client);
    };

    // Listen for error event
    const errorHandler = (err: Error) => {
      clearTimeout(timeout);
      client.removeListener("ready", readyHandler);
      reject(err);
    };

    // Attach listeners
    client.once("ready", readyHandler);
    client.once("error", errorHandler);

    // Start login process
    info("Starting login process and waiting for ready event");
    client.login(token).catch((err: Error) => {
      clearTimeout(timeout);
      client.removeListener("ready", readyHandler);
      client.removeListener("error", errorHandler);
      reject(err);
    });
  });
}

// Enhanced login handler with better error handling and status reporting
export const loginHandler: ToolHandler = async (args, context) => {
  DiscordLoginSchema.parse(args);
  try {
    // Check if client is already logged in
    if (context.client.isReady()) {
      const userTag = context.client.user?.tag;
      const guildCount = context.client.guilds.cache.size;
      const channelCount = context.client.channels.cache.size;

      return {
        content: [
          {
            type: "text",
            text:
              `Already logged in as: ${userTag}\n` +
              `Connected to ${guildCount} servers\n` +
              `Available in ${channelCount} channels`,
          },
        ],
      };
    }

    // Use token from args if provided, otherwise fall back to the client's token
    const token = args.token || context.client.token;

    // Check if we have a token to use
    if (!token) {
      const config = configManager.getConfig();
      const missingReqs = configManager.getMissingRequirements();

      let errorMessage =
        "Discord token not provided and not configured. Cannot log in.\n\n";
      errorMessage += "Please check the following:\n";
      errorMessage += "1. Provide a token in the login command\n";
      errorMessage += "2. Set DISCORD_TOKEN environment variable\n";
      errorMessage += "3. Use discord_set_token tool to configure token\n\n";

      if (missingReqs.length > 0) {
        errorMessage += "Missing requirements:\n";
        missingReqs.forEach((req) => (errorMessage += `- ${req}\n`));
      }

      errorMessage +=
        "\nEnsure all required privileged intents (Message Content, Server Members, Presence) are enabled in the Discord Developer Portal for your bot application.";

      return {
        content: [{ type: "text", text: errorMessage }],
        isError: true,
      };
    }

    // If token is provided in args, update the client's token and config
    if (args.token) {
      context.client.token = args.token;
      configManager.updateToken(args.token);
    }

    // Attempt to log in with the token and get the ready client
    const readyClient = await waitForReady(context.client, token);
    // Update the context client with the ready client
    context.client = readyClient;

    const userTag = context.client.user?.tag;
    const guildCount = context.client.guilds.cache.size;
    const channelCount = context.client.channels.cache.size;

    return {
      content: [
        {
          type: "text",
          text:
            `Successfully logged in to Discord: ${userTag}\n` +
            `Connected to ${guildCount} servers\n` +
            `Available in ${channelCount} channels\n` +
            `Token has been saved to configuration`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error in login handler: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Token management handler
export const setTokenHandler: ToolHandler = async (args, context) => {
  try {
    const { token } = args as { token: string };

    if (!token || typeof token !== "string" || token.length < 50) {
      return {
        content: [
          {
            type: "text",
            text: "Invalid token provided. Discord tokens should be at least 50 characters long.",
          },
        ],
        isError: true,
      };
    }

    // Update configuration
    configManager.updateToken(token);

    // Update client token if it exists
    if (context.client) {
      context.client.token = token;
    }

    return {
      content: [
        {
          type: "text",
          text: "Discord token has been successfully configured and saved.",
        },
      ],
    };
  } catch (err) {
    error(
      `Error setting token: ${err instanceof Error ? err.message : String(err)}`,
    );
    return {
      content: [
        {
          type: "text",
          text: `Failed to set token: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
};

// Token validation handler
export const validateTokenHandler: ToolHandler = async (args, context) => {
  try {
    const config = configManager.getConfig();

    if (!config.DISCORD_TOKEN) {
      return {
        content: [
          {
            type: "text",
            text: "No Discord token configured. Use discord_set_token to configure a token first.",
          },
        ],
        isError: true,
      };
    }

    // Basic token format validation
    const token = config.DISCORD_TOKEN;
    if (token.length < 50) {
      return {
        content: [
          {
            type: "text",
            text: "Token appears to be too short. Discord bot tokens are typically 59 characters long.",
          },
        ],
        isError: true,
      };
    }

    // Check if token starts with bot prefix (optional but common)
    if (!token.startsWith("Bot ") && !token.startsWith("Bearer ")) {
      return {
        content: [
          {
            type: "text",
            text: "Token format looks unusual. Discord bot tokens typically start with 'Bot ' or 'Bearer '.",
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: "Token format appears valid. Use discord_login to test the connection.",
        },
      ],
    };
  } catch (err) {
    error(
      `Error validating token: ${err instanceof Error ? err.message : String(err)}`,
    );
    return {
      content: [
        {
          type: "text",
          text: `Failed to validate token: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
};

// Login status handler
export const loginStatusHandler: ToolHandler = async (args, context) => {
  try {
    const config = configManager.getConfig();
    const healthStatus = configManager.getHealthStatus();

    let statusMessage = "## Discord Login Status\n\n";

    // Token status
    statusMessage += `**Token Configured:** ${config.DISCORD_TOKEN ? "✅ Yes" : "❌ No"}\n`;

    // Client status
    const isLoggedIn = context.client?.isReady() || false;
    statusMessage += `**Logged In:** ${isLoggedIn ? "✅ Yes" : "❌ No"}\n`;

    if (isLoggedIn && context.client) {
      statusMessage += `**Bot User:** ${context.client.user?.tag}\n`;
      statusMessage += `**Connected Servers:** ${context.client.guilds.cache.size}\n`;
      statusMessage += `**Available Channels:** ${context.client.channels.cache.size}\n`;
      statusMessage += `**Uptime:** ${Math.floor(context.client.uptime! / 1000 / 60)} minutes\n`;
    }

    // Health status
    statusMessage += `\n**Health Status:** ${healthStatus.status.toUpperCase()}\n`;

    if (healthStatus.details.length > 0) {
      statusMessage += "\n**Issues:**\n";
      healthStatus.details.forEach((detail) => {
        statusMessage += `- ${detail}\n`;
      });
    }

    // Configuration summary
    statusMessage += "\n**Configuration:**\n";
    const configSummary = configManager.getConfigSummary();
    Object.entries(configSummary).forEach(([key, value]) => {
      if (key === "DISCORD_TOKEN" && value) {
        statusMessage += `- ${key}: ${value} (masked)\n`;
      } else {
        statusMessage += `- ${key}: ${value}\n`;
      }
    });

    return {
      content: [{ type: "text", text: statusMessage }],
    };
  } catch (err) {
    error(
      `Error getting login status: ${err instanceof Error ? err.message : String(err)}`,
    );
    return {
      content: [
        {
          type: "text",
          text: `Failed to get login status: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
};

// Logout handler
export const logoutHandler: ToolHandler = async (args, context) => {
  try {
    if (!context.client?.isReady()) {
      return {
        content: [
          { type: "text", text: "Not currently logged in to Discord." },
        ],
      };
    }

    const userTag = context.client.user?.tag;
    const guildCount = context.client.guilds.cache.size;

    // Destroy the client connection
    await context.client.destroy();

    return {
      content: [
        {
          type: "text",
          text:
            `Successfully logged out from Discord.\n` +
            `Previous session: ${userTag}\n` +
            `Was connected to ${guildCount} servers\n` +
            `Use discord_login to reconnect.`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error during logout: ${err instanceof Error ? err.message : String(err)}`,
    );
    return {
      content: [
        {
          type: "text",
          text: `Logout failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
};

// Configuration management handler
export const updateConfigHandler: ToolHandler = async (args, context) => {
  try {
    const updates = args as Record<string, any>;

    // Validate allowed configuration keys
    const allowedKeys = [
      "ALLOW_GUILD_IDS",
      "ALLOW_CHANNEL_IDS",
      "ENABLE_USER_MANAGEMENT",
      "ENABLE_VOICE_CHANNELS",
      "ENABLE_DIRECT_MESSAGES",
      "ENABLE_SERVER_MANAGEMENT",
      "ENABLE_RBAC",
      "ENABLE_CONTENT_MANAGEMENT",
      "TRANSPORT",
      "HTTP_PORT",
    ];

    const invalidKeys = Object.keys(updates).filter(
      (key) => !allowedKeys.includes(key),
    );

    if (invalidKeys.length > 0) {
      return {
        content: [
          {
            type: "text",
            text: `Invalid configuration keys: ${invalidKeys.join(", ")}\n\nAllowed keys: ${allowedKeys.join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    // Apply configuration updates
    for (const [key, value] of Object.entries(updates)) {
      switch (key) {
        case "ALLOW_GUILD_IDS":
          if (Array.isArray(value)) {
            process.env.ALLOW_GUILD_IDS = value.join(",");
          }
          break;
        case "ALLOW_CHANNEL_IDS":
          if (Array.isArray(value)) {
            process.env.ALLOW_CHANNEL_IDS = value.join(",");
          }
          break;
        case "ENABLE_USER_MANAGEMENT":
        case "ENABLE_VOICE_CHANNELS":
        case "ENABLE_DIRECT_MESSAGES":
        case "ENABLE_SERVER_MANAGEMENT":
        case "ENABLE_RBAC":
        case "ENABLE_CONTENT_MANAGEMENT":
          if (typeof value === "boolean") {
            process.env[key] = value ? "1" : "0";
          }
          break;
        case "TRANSPORT":
          if (value === "stdio" || value === "http") {
            process.env.TRANSPORT = value;
          }
          break;
        case "HTTP_PORT":
          if (typeof value === "number" && value > 0 && value <= 65535) {
            process.env.HTTP_PORT = value.toString();
          }
          break;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Configuration updated successfully.\n\nUpdated settings:\n${Object.entries(
            updates,
          )
            .map(([k, v]) => `- ${k}: ${v}`)
            .join(
              "\n",
            )}\n\nNote: Some changes may require server restart to take effect.`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error updating configuration: ${err instanceof Error ? err.message : String(err)}`,
    );
    return {
      content: [
        {
          type: "text",
          text: `Failed to update configuration: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
};

// Health check handler
export const healthCheckHandler: ToolHandler = async (args, context) => {
  try {
    const config = configManager.getConfig();
    const healthStatus = configManager.getHealthStatus();

    let healthReport = "## Health Check Report\n\n";

    // Overall status
    healthReport += `**Overall Status:** ${healthStatus.status.toUpperCase()}\n\n`;

    // Component checks
    healthReport += "**Component Status:**\n";
    Object.entries(healthStatus.checks).forEach(([check, status]) => {
      const icon = status ? "✅" : "❌";
      healthReport += `${icon} ${check.replace(/_/g, " ")}\n`;
    });

    // Issues
    if (healthStatus.details.length > 0) {
      healthReport += "\n**Issues Found:**\n";
      healthStatus.details.forEach((detail) => {
        healthReport += `⚠️ ${detail}\n`;
      });
    }

    // Recommendations
    healthReport += "\n**Recommendations:**\n";
    if (!config.DISCORD_TOKEN) {
      healthReport +=
        "- Set DISCORD_TOKEN environment variable or use discord_set_token to enable Discord features\n";
      healthReport +=
        "- Server is fully operational for MCP operations without Discord token\n";
    }
    if (healthStatus.status === "degraded") {
      healthReport += "- Review configuration settings\n";
    }
    if (healthStatus.status === "healthy") {
      healthReport += "- All systems operational ✅\n";
    }

    // Add deployment status
    healthReport += "\n**Deployment Status:**\n";
    healthReport += "✅ MCP Server: Successfully deployed and ready\n";
    if (config.DISCORD_TOKEN) {
      healthReport += "✅ Discord Integration: Configured and ready\n";
    } else {
      healthReport +=
        "⚠️ Discord Integration: Token required for Discord features\n";
    }

    return {
      content: [{ type: "text", text: healthReport }],
    };
  } catch (err) {
    error(
      `Error during health check: ${err instanceof Error ? err.message : String(err)}`,
    );
    return {
      content: [
        {
          type: "text",
          text: `Health check failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
};
