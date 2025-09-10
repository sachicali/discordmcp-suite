#!/usr/bin/env node
import { Client, GatewayIntentBits } from "discord.js";
import { config as dotenvConfig } from "dotenv";
import { DiscordMCPServer } from "./server.js";
import { StdioTransport, StreamableHttpTransport } from "./transport.js";
import { info, error } from "./logger.js";
import { configManager } from "./config.js";

// Load environment variables from .env file if exists
dotenvConfig();

// Get configuration from the config manager
const config = configManager.getConfig();

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Save token to client for login handler
if (config.DISCORD_TOKEN) {
  client.token = config.DISCORD_TOKEN;
}

// Enhanced auto-login with better error handling for Smithery deployment
const autoLogin = async () => {
  const token = config.DISCORD_TOKEN;

  if (!token) {
    info("=== DISCORD CONFIGURATION STATUS ===");
    info(
      "No Discord token configured. Server will start but Discord functionality will be limited.",
    );
    const availableEnvVars = Object.keys(process.env).filter(
      (key) =>
        key.toLowerCase().includes("discord") ||
        key.toLowerCase().includes("token"),
    );
    info(`Available environment variables: ${availableEnvVars.join(", ")}`);
    info("To enable Discord features:");
    info("  1. Set the DISCORD_TOKEN environment variable");
    info("  2. Or use the discord_login tool to provide a token");
    info("  3. Or use discord_set_token tool to configure token");
    info("=====================================");
    return;
  }

  info(`Discord token configured (length: ${token.length})`);

  try {
    info("Attempting to log in to Discord...");
    await client.login(token);

    // Wait for the client to be ready with timeout
    if (!client.isReady()) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Discord client ready timeout after 30 seconds"));
        }, 30000);

        client.once("ready", () => {
          clearTimeout(timeout);
          info(`Discord client is now ready as: ${client.user?.tag}`);
          resolve();
        });
      });
    }

    info("Successfully logged in to Discord and client is ready");

    // Log additional connection info
    info(`Connected to ${client.guilds.cache.size} servers`);
    info(`Available in ${client.channels.cache.size} channels`);
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes("Privileged intent provided is not enabled")) {
      error(
        "Login failed: Privileged intents not enabled in Discord Developer Portal",
      );
      error("Required intents: Message Content, Server Members, Presence");
      error(
        "Please enable these in https://discord.com/developers/applications",
      );
    } else if (errorMessage.includes("Invalid token")) {
      error("Login failed: Invalid Discord token provided");
      error("Please check your DISCORD_TOKEN environment variable");
    } else if (errorMessage.includes("Connection timeout")) {
      error("Login failed: Connection timeout - check network connectivity");
    } else {
      error(`Auto-login failed: ${errorMessage}`);
    }

    // For Smithery deployment, don't exit on login failure
    // Just log the error and continue - user can use discord_login tool later
    error(
      "Server will continue without Discord functionality. Use discord_login tool to connect later.",
    );
  }
};

// Initialize transport based on configuration
const initializeTransport = () => {
  switch (config.TRANSPORT.toLowerCase()) {
    case "http":
      info(`Initializing HTTP transport on 0.0.0.0:${config.HTTP_PORT}`);
      return new StreamableHttpTransport(config.HTTP_PORT);
    case "stdio":
      info("Initializing stdio transport");
      return new StdioTransport();
    default:
      error(
        `Unknown transport type: ${config.TRANSPORT}. Falling back to stdio.`,
      );
      return new StdioTransport();
  }
};

// Start auto-login process
await autoLogin();

// Create and start MCP server with selected transport
const transport = initializeTransport();
const mcpServer = new DiscordMCPServer(client, transport);

try {
  await mcpServer.start();
  info("MCP server started successfully");

  // Keep the Node.js process running
  if (config.TRANSPORT.toLowerCase() === "http") {
    // Send a heartbeat every 30 seconds to keep the process alive
    setInterval(() => {
      info("MCP server is running");
    }, 30000);

    // Handle termination signals
    process.on("SIGINT", async () => {
      info("Received SIGINT. Shutting down server...");
      await mcpServer.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      info("Received SIGTERM. Shutting down server...");
      await mcpServer.stop();
      process.exit(0);
    });

    info("Server running in keep-alive mode. Press Ctrl+C to stop.");
  }
} catch (err) {
  error("Failed to start MCP server: " + String(err));
  process.exit(1);
}
