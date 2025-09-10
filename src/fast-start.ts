#!/usr/bin/env node

/**
 * Fast-start entry point for cloud deployments
 * Prioritizes getting the HTTP server running quickly over Discord connection
 */

import { Client, GatewayIntentBits } from "discord.js";
import { config as dotenvConfig } from "dotenv";
import { DiscordMCPServer } from "./server.js";
import { StreamableHttpTransport } from "./transport.js";
// import { info, error } from "./logger.js"; // Using console.log for faster startup

// Quick startup sequence
console.log("🚀 Starting MCP Discord Server (Fast Mode)...");

// Load environment variables (ignore errors)
try {
  dotenvConfig();
} catch (e) {
  console.log("dotenv skipped");
}

// Get basic config
const DISCORD_TOKEN =
  process.env.DISCORD_TOKEN ||
  process.env.discordToken ||
  process.env.DISCORDTOKEN ||
  process.env.token ||
  process.env.BOT_TOKEN;
const HTTP_PORT = parseInt(process.env.PORT || process.env.HTTP_PORT || "8080");

console.log(`Discord token present: ${!!DISCORD_TOKEN}`);
console.log(`HTTP port: ${HTTP_PORT}`);

// Create Discord client with minimal intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Set token if available
if (DISCORD_TOKEN) {
  client.token = DISCORD_TOKEN;
}

// Create HTTP transport (fast startup)
const transport = new StreamableHttpTransport(HTTP_PORT);

// Create MCP server
const mcpServer = new DiscordMCPServer(client, transport);

// Start server immediately
async function startServer() {
  try {
    console.log("Starting HTTP server...");
    await mcpServer.start();
    console.log("✅ MCP server started successfully");
    console.log(`✅ Server ready at http://0.0.0.0:${HTTP_PORT}`);
    console.log("✅ Health check: /health");
    console.log("✅ Config check: /config");

    // Discord login in background (non-blocking)
    if (DISCORD_TOKEN) {
      console.log("Starting Discord connection in background...");
      setTimeout(async () => {
        try {
          await client.login(DISCORD_TOKEN);
          if (client.isReady()) {
            console.log(`✅ Discord connected as: ${client.user?.tag}`);
          }
        } catch (err) {
          console.log(
            `⚠️ Discord connection failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }, 100); // Start after 100ms delay
    } else {
      console.log(
        "⚠️ No Discord token - server will work with limited functionality",
      );
    }

    // Keep alive
    setInterval(() => {
      console.log("❤️ Server alive");
    }, 60000);
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
}

// Handle shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await mcpServer.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await mcpServer.stop();
  process.exit(0);
});

// Start the server
startServer();
