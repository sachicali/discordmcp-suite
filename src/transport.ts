import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { Request, Response } from "express";
import { toolList } from "./toolList.js";
import {
  createToolContext,
  loginHandler,
  setTokenHandler,
  validateTokenHandler,
  loginStatusHandler,
  logoutHandler,
  updateConfigHandler,
  healthCheckHandler,
  listServersHandler,
  sendMessageHandler,
  getForumChannelsHandler,
  createForumPostHandler,
  getForumPostHandler,
  replyToForumHandler,
  deleteForumPostHandler,
  createTextChannelHandler,
  deleteChannelHandler,
  readMessagesHandler,
  getServerInfoHandler,
  addReactionHandler,
  addMultipleReactionsHandler,
  removeReactionHandler,
  deleteMessageHandler,
  createWebhookHandler,
  sendWebhookMessageHandler,
  editWebhookHandler,
  deleteWebhookHandler,
  editCategoryHandler,
  createCategoryHandler,
  deleteCategoryHandler,
} from "./tools/tools.js";
import { Client, GatewayIntentBits } from "discord.js";
import { info, error } from "./logger.js";
import { configManager } from "./config.js";

export interface MCPTransport {
  start(server: Server): Promise<void>;
  stop(): Promise<void>;
}

export class StdioTransport implements MCPTransport {
  private transport: StdioServerTransport | null = null;

  async start(server: Server): Promise<void> {
    this.transport = new StdioServerTransport();
    await server.connect(this.transport);
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }
}

export class StreamableHttpTransport implements MCPTransport {
  private app: express.Application;
  private server: Server | null = null;
  private httpServer: any = null;
  private transport: StreamableHTTPServerTransport | null = null;
  private toolContext: ReturnType<typeof createToolContext> | null = null;
  private sessionId: string = "";

  constructor(private port: number = 8080) {
    this.app = express();
    this.app.use(express.json());
    this.setupEndpoints();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    info(`Created HTTP transport with session ID: ${this.sessionId}`);
  }

  private setupEndpoints() {
    // Health check endpoint for cloud deployment and monitoring
    this.app.get("/health", (_req: Request, res: Response) => {
      try {
        const healthStatus = this.getHealthStatus();
        const statusCode =
          healthStatus.status === "healthy"
            ? 200
            : healthStatus.status === "degraded"
              ? 200
              : 503;

        res.status(statusCode).json({
          status: healthStatus.status,
          timestamp: new Date().toISOString(),
          version: "1.4.0",
          service: "discordmcp-suite",
          checks: healthStatus.checks,
          details: healthStatus.details,
        });
      } catch (err) {
        error("Health check error: " + String(err));
        res.status(500).json({
          status: "error",
          timestamp: new Date().toISOString(),
          error: "Health check failed",
        });
      }
    });

    // Readiness probe endpoint for Kubernetes/cloud deployments
    this.app.get("/ready", (_req: Request, res: Response) => {
      try {
        const healthStatus = this.getHealthStatus();
        const isReady =
          healthStatus.status === "healthy" ||
          healthStatus.status === "degraded";

        res.status(isReady ? 200 : 503).json({
          ready: isReady,
          status: healthStatus.status,
          timestamp: new Date().toISOString(),
          service: "discordmcp-suite",
        });
      } catch (err) {
        error("Readiness check error: " + String(err));
        res.status(503).json({
          ready: false,
          status: "error",
          timestamp: new Date().toISOString(),
          error: "Readiness check failed",
        });
      }
    });

    // Configuration endpoint for Smithery deployment
    this.app.get("/config", (_req: Request, res: Response) => {
      try {
        const configSummary = this.getConfigSummary();
        const missingRequirements = this.getMissingRequirements();

        // Debug: Log environment variables
        const debugInfo = {
          has_discord_token: !!process.env.DISCORD_TOKEN,
          discord_token_length: process.env.DISCORD_TOKEN?.length || 0,
          has_debug_token: !!process.env.DEBUG_TOKEN,
          debug_token_value: process.env.DEBUG_TOKEN,
          all_env_keys: Object.keys(process.env).filter(
            (key) =>
              key.toLowerCase().includes("discord") ||
              key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("debug"),
          ),
        };

        info(`Config endpoint debug: ${JSON.stringify(debugInfo)}`);

        res.json({
          configured: this.isConfigured(),
          config: configSummary,
          missing_requirements: missingRequirements,
          debug: debugInfo,
          timestamp: new Date().toISOString(),
          service: "discordmcp-suite",
        });
      } catch (err) {
        error("Config endpoint error: " + String(err));
        res.status(500).json({
          error: "Configuration check failed",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Status endpoint for deployment monitoring
    this.app.get("/status", (_req: Request, res: Response) => {
      try {
        const healthStatus = this.getHealthStatus();
        const configSummary = this.getConfigSummary();

        res.json({
          service: "discordmcp-suite",
          version: "1.4.0",
          status: healthStatus.status,
          configured: this.isConfigured(),
          transport: "http",
          port: this.port,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
          health_checks: healthStatus.checks,
          config_summary: configSummary,
        });
      } catch (err) {
        error("Status endpoint error: " + String(err));
        res.status(500).json({
          service: "mcp-discord-server",
          status: "error",
          error: "Status check failed",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handler for POST requests
    this.app.post("/mcp", (req: Request, res: Response) => {
      info("Received MCP request: " + JSON.stringify(req.body));
      this.handleMcpRequest(req, res).catch((error) => {
        error("Unhandled error in MCP request: " + String(error));
      });
    });

    // Handler for non-POST methods
    this.app.all("/mcp", (req: Request, res: Response) => {
      if (req.method !== "POST") {
        res.status(405).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed. Use POST.",
          },
          id: null,
        });
      }
    });
  }

  private async handleMcpRequest(req: Request, res: Response) {
    try {
      if (!this.server) {
        return res.json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Server not initialized",
          },
          id: req.body?.id || null,
        });
      }

      info(
        `Request body (session ${this.sessionId}): ${JSON.stringify(req.body)}`,
      );

      // Handle all tool requests in a generic way
      if (!req.body.method) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "Invalid Request: No method specified",
          },
          id: req.body?.id || null,
        });
      }

      // Handle all tools directly with proper error handling
      try {
        const method = req.body.method;
        const params = req.body.params || {};

        // Make sure toolContext is available for tool methods
        if (
          !this.toolContext &&
          method !== "list_tools" &&
          method !== "initialize"
        ) {
          return res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message:
                "Tool context not initialized. Service may need to be restarted.",
            },
            id: req.body?.id || null,
          });
        }

        let result;

        // Handle each tool method directly
        switch (method) {
          case "initialize":
            // Handle initialize method for MCP protocol compliance
            info("=== MCP SERVER INITIALIZATION ===");
            info(`DISCORD_TOKEN present: ${!!process.env.DISCORD_TOKEN}`);
            info(
              `DISCORD_TOKEN length: ${process.env.DISCORD_TOKEN?.length || 0}`,
            );
            info(`DEBUG_TOKEN present: ${!!process.env.DEBUG_TOKEN}`);
            info(`DEBUG_TOKEN value: ${process.env.DEBUG_TOKEN}`);
            info(`discordToken present: ${!!process.env.discordToken}`);
            info(
              `discordToken length: ${process.env.discordToken?.length || 0}`,
            );
            info(`DISCORDTOKEN present: ${!!process.env.DISCORDTOKEN}`);
            info(
              `DISCORDTOKEN length: ${process.env.DISCORDTOKEN?.length || 0}`,
            );
            info(`token present: ${!!process.env.token}`);
            info(`token length: ${process.env.token?.length || 0}`);
            info(
              `All env vars with 'discord' or 'token': ${Object.keys(
                process.env,
              )
                .filter(
                  (key) =>
                    key.toLowerCase().includes("discord") ||
                    key.toLowerCase().includes("token") ||
                    key.toLowerCase().includes("debug"),
                )
                .join(", ")}`,
            );
            info("=== END INITIALIZATION LOG ===");

            result = {
              protocolVersion: "2025-03-26",
              capabilities: {
                tools: {
                  listChanged: false,
                },
              },
              serverInfo: {
                name: "MCP-Discord",
                version: "1.2.0",
              },
            };
            break;

          case "notifications/initialized":
            // Client indicates it's ready to begin normal operation
            info("Client initialized. Starting normal operations.");
            // No result needed for notifications
            return res.json({
              jsonrpc: "2.0",
              result: null,
              id: req.body.id,
            });

          case "tools/list":
            // New MCP method name format
            info("=== TOOLS LIST REQUEST ===");
            info(`DISCORD_TOKEN present: ${!!process.env.DISCORD_TOKEN}`);
            info(
              `DISCORD_TOKEN length: ${process.env.DISCORD_TOKEN?.length || 0}`,
            );
            info(`DEBUG_TOKEN present: ${!!process.env.DEBUG_TOKEN}`);
            info(`discordToken present: ${!!process.env.discordToken}`);
            info(
              `discordToken length: ${process.env.discordToken?.length || 0}`,
            );
            info(`DISCORDTOKEN present: ${!!process.env.DISCORDTOKEN}`);
            info(
              `DISCORDTOKEN length: ${process.env.DISCORDTOKEN?.length || 0}`,
            );
            info(`token present: ${!!process.env.token}`);
            info(`token length: ${process.env.token?.length || 0}`);
            info("=== END TOOLS LIST LOG ===");

            result = { tools: toolList };
            break;

          case "list_tools":
            // Legacy method name for backward compatibility
            result = { tools: toolList };
            break;

          case "discord_login":
            info("=== DISCORD LOGIN ATTEMPT ===");
            info(
              `Environment DISCORD_TOKEN present: ${!!process.env.DISCORD_TOKEN}`,
            );
            info(
              `Environment DISCORD_TOKEN length: ${process.env.DISCORD_TOKEN?.length || 0}`,
            );
            info(
              `Environment discordToken present: ${!!process.env.discordToken}`,
            );
            info(
              `Environment discordToken length: ${process.env.discordToken?.length || 0}`,
            );
            info(
              `Environment DISCORDTOKEN present: ${!!process.env.DISCORDTOKEN}`,
            );
            info(
              `Environment DISCORDTOKEN length: ${process.env.DISCORDTOKEN?.length || 0}`,
            );
            info(`Environment token present: ${!!process.env.token}`);
            info(`Environment token length: ${process.env.token?.length || 0}`);
            info(`Client token present: ${!!this.toolContext!.client.token}`);
            info(
              `Client token length: ${this.toolContext!.client.token?.length || 0}`,
            );
            info("=== END LOGIN ATTEMPT LOG ===");

            result = await loginHandler(params, this.toolContext!);
            // Log client state after login
            info(
              `Client state after login: ${JSON.stringify({
                isReady: this.toolContext!.client.isReady(),
                hasToken: !!this.toolContext!.client.token,
                user: this.toolContext!.client.user
                  ? {
                      id: this.toolContext!.client.user.id,
                      tag: this.toolContext!.client.user.tag,
                    }
                  : null,
              })}`,
            );
            break;

          case "discord_login_status":
            result = await loginStatusHandler({}, this.toolContext!);
            break;

          case "discord_set_token":
            result = await setTokenHandler(params, this.toolContext!);
            break;

          case "discord_validate_token":
            result = await validateTokenHandler(params, this.toolContext!);
            break;

          case "discord_logout":
            result = await logoutHandler(params, this.toolContext!);
            break;

          case "discord_update_config":
            result = await updateConfigHandler(params, this.toolContext!);
            break;

          case "discord_health_check":
            result = await healthCheckHandler(params, this.toolContext!);
            break;

          case "discord_list_servers":
            // Check if client is logged in
            if (!this.toolContext!.client.isReady()) {
              return res.json({
                jsonrpc: "2.0",
                error: {
                  code: -32603,
                  message:
                    "Discord client not logged in. Please use discord_login tool first.",
                },
                id: req.body?.id || null,
              });
            }

            result = await listServersHandler({}, this.toolContext!);
            break;

          case "discord_list_servers":
            // Check if client is logged in
            if (!this.toolContext!.client.isReady()) {
              return res.json({
                jsonrpc: "2.0",
                error: {
                  code: -32603,
                  message:
                    "Discord client not logged in. Please use discord_login tool first.",
                },
                id: req.body?.id || null,
              });
            }
            result = await listServersHandler({}, this.toolContext!);
            break;

          // Make sure Discord client is logged in for other Discord API tools
          // but return a proper JSON-RPC error rather than throwing an exception
          case "discord_send":
          case "discord_get_forum_channels":
          case "discord_create_forum_post":
          case "discord_get_forum_post":
          case "discord_reply_to_forum":
          case "discord_delete_forum_post":
          case "discord_create_text_channel":
          case "discord_delete_channel":
          case "discord_read_messages":
          case "discord_get_server_info":
          case "discord_add_reaction":
          case "discord_add_multiple_reactions":
          case "discord_remove_reaction":
          case "discord_delete_message":
          case "discord_create_webhook":
          case "discord_send_webhook_message":
          case "discord_edit_webhook":
          case "discord_delete_webhook":
          case "discord_create_category":
          case "discord_edit_category":
          case "discord_delete_category":
            // Check if client is logged in
            if (!this.toolContext!.client.isReady()) {
              error(
                `Client not ready for method ${method}, client state: ${JSON.stringify(
                  {
                    isReady: this.toolContext!.client.isReady(),
                    hasToken: !!this.toolContext!.client.token,
                    user: this.toolContext!.client.user
                      ? {
                          id: this.toolContext!.client.user.id,
                          tag: this.toolContext!.client.user.tag,
                        }
                      : null,
                  },
                )}`,
              );

              // Check if we have a token but not ready - try to force reconnect
              if (this.toolContext!.client.token) {
                info("Has token but not ready - attempting to force reconnect");
                try {
                  // Attempt to force login with existing token
                  await this.toolContext!.client.login(
                    this.toolContext!.client.token,
                  );
                  info(
                    `Force reconnect successful: ${this.toolContext!.client.isReady()}`,
                  );

                  // If still not ready after reconnect, return error
                  if (!this.toolContext!.client.isReady()) {
                    return res.json({
                      jsonrpc: "2.0",
                      error: {
                        code: -32603,
                        message:
                          "Discord client reconnect failed. Please use discord_login tool first.",
                      },
                      id: req.body?.id || null,
                    });
                  }

                  // Continue with original request as now logged in
                  info(
                    "Reconnected successfully, continuing with original request",
                  );
                } catch (reconnectError) {
                  error(
                    `Reconnect failed: ${reconnectError instanceof Error ? reconnectError.message : String(reconnectError)}`,
                  );
                  return res.json({
                    jsonrpc: "2.0",
                    error: {
                      code: -32603,
                      message:
                        "Discord client reconnect failed. Please use discord_login tool first.",
                    },
                    id: req.body?.id || null,
                  });
                }
              } else {
                return res.json({
                  jsonrpc: "2.0",
                  error: {
                    code: -32603,
                    message:
                      "Discord client not logged in. Please use discord_login tool first.",
                  },
                  id: req.body?.id || null,
                });
              }
            }

            // Call appropriate handler based on method
            switch (method) {
              case "discord_send":
                result = await sendMessageHandler(params, this.toolContext!);
                break;
              case "discord_get_forum_channels":
                result = await getForumChannelsHandler(
                  params,
                  this.toolContext!,
                );
                break;
              case "discord_create_forum_post":
                result = await createForumPostHandler(
                  params,
                  this.toolContext!,
                );
                break;
              case "discord_get_forum_post":
                result = await getForumPostHandler(params, this.toolContext!);
                break;
              case "discord_reply_to_forum":
                result = await replyToForumHandler(params, this.toolContext!);
                break;
              case "discord_delete_forum_post":
                result = await deleteForumPostHandler(
                  params,
                  this.toolContext!,
                );
                break;
              case "discord_create_text_channel":
                result = await createTextChannelHandler(
                  params,
                  this.toolContext!,
                );
                break;
              case "discord_delete_channel":
                result = await deleteChannelHandler(params, this.toolContext!);
                break;
              case "discord_read_messages":
                result = await readMessagesHandler(params, this.toolContext!);
                break;
              case "discord_get_server_info":
                result = await getServerInfoHandler(params, this.toolContext!);
                break;
              case "discord_add_reaction":
                result = await addReactionHandler(params, this.toolContext!);
                break;
              case "discord_add_multiple_reactions":
                result = await addMultipleReactionsHandler(
                  params,
                  this.toolContext!,
                );
                break;
              case "discord_remove_reaction":
                result = await removeReactionHandler(params, this.toolContext!);
                break;
              case "discord_delete_message":
                result = await deleteMessageHandler(params, this.toolContext!);
                break;
              case "discord_create_webhook":
                result = await createWebhookHandler(params, this.toolContext!);
                break;
              case "discord_send_webhook_message":
                result = await sendWebhookMessageHandler(
                  params,
                  this.toolContext!,
                );
                break;
              case "discord_edit_webhook":
                result = await editWebhookHandler(params, this.toolContext!);
                break;
              case "discord_delete_webhook":
                result = await deleteWebhookHandler(params, this.toolContext!);
                break;
              case "discord_create_category":
                result = await createCategoryHandler(params, this.toolContext!);
                break;
              case "discord_edit_category":
                result = await editCategoryHandler(params, this.toolContext!);
                break;
              case "discord_delete_category":
                result = await deleteCategoryHandler(params, this.toolContext!);
                break;
            }
            break;

          case "tools/call":
            // Handle new tools/call method format
            const toolName = params.name;
            const toolArgs = params.arguments || {};

            // Check if Discord client is logged in for Discord API tools
            if (
              toolName !== "discord_login" &&
              toolName.startsWith("discord_") &&
              !this.toolContext!.client.isReady()
            ) {
              error(
                `Client not ready for tool ${toolName}, client state: ${JSON.stringify(
                  {
                    isReady: this.toolContext!.client.isReady(),
                    hasToken: !!this.toolContext!.client.token,
                    user: this.toolContext!.client.user
                      ? {
                          id: this.toolContext!.client.user.id,
                          tag: this.toolContext!.client.user.tag,
                        }
                      : null,
                  },
                )}`,
              );

              // Check if we have a token but not ready - try to force reconnect
              if (this.toolContext!.client.token) {
                info("Has token but not ready - attempting to force reconnect");
                try {
                  // Attempt to force login with existing token
                  await this.toolContext!.client.login(
                    this.toolContext!.client.token,
                  );
                  info(
                    `Force reconnect successful: ${this.toolContext!.client.isReady()}`,
                  );

                  // If still not ready after reconnect, return error
                  if (!this.toolContext!.client.isReady()) {
                    return res.json({
                      jsonrpc: "2.0",
                      error: {
                        code: -32603,
                        message:
                          "Discord client reconnect failed. Please use discord_login tool first.",
                      },
                      id: req.body?.id || null,
                    });
                  }

                  // Continue with original request as now logged in
                  info(
                    "Reconnected successfully, continuing with original request",
                  );
                } catch (reconnectError) {
                  error(
                    `Reconnect failed: ${reconnectError instanceof Error ? reconnectError.message : String(reconnectError)}`,
                  );
                  return res.json({
                    jsonrpc: "2.0",
                    error: {
                      code: -32603,
                      message:
                        "Discord client reconnect failed. Please use discord_login tool first.",
                    },
                    id: req.body?.id || null,
                  });
                }
              } else {
                return res.json({
                  jsonrpc: "2.0",
                  error: {
                    code: -32603,
                    message:
                      "Discord client not logged in. Please use discord_login tool first.",
                  },
                  id: req.body?.id || null,
                });
              }
            }

            // Call the appropriate handler based on tool name
            switch (toolName) {
              case "discord_login":
                result = await loginHandler(toolArgs, this.toolContext!);
                // Log client state after login
                info(
                  `Client state after login: ${JSON.stringify({
                    isReady: this.toolContext!.client.isReady(),
                    hasToken: !!this.toolContext!.client.token,
                    user: this.toolContext!.client.user
                      ? {
                          id: this.toolContext!.client.user.id,
                          tag: this.toolContext!.client.user.tag,
                        }
                      : null,
                  })}`,
                );
                break;

              case "discord_set_token":
                result = await setTokenHandler(toolArgs, this.toolContext!);
                break;

              case "discord_validate_token":
                result = await validateTokenHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_login_status":
                result = await loginStatusHandler(toolArgs, this.toolContext!);
                break;

              case "discord_logout":
                result = await logoutHandler(toolArgs, this.toolContext!);
                break;

              case "discord_update_config":
                result = await updateConfigHandler(toolArgs, this.toolContext!);
                break;

              case "discord_health_check":
                result = await healthCheckHandler(toolArgs, this.toolContext!);
                break;

              case "discord_list_servers":
                result = await listServersHandler(toolArgs, this.toolContext!);
                break;

              case "discord_send":
                result = await sendMessageHandler(toolArgs, this.toolContext!);
                break;

              case "discord_get_forum_channels":
                result = await getForumChannelsHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_create_forum_post":
                result = await createForumPostHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_get_forum_post":
                result = await getForumPostHandler(toolArgs, this.toolContext!);
                break;

              case "discord_reply_to_forum":
                result = await replyToForumHandler(toolArgs, this.toolContext!);
                break;

              case "discord_delete_forum_post":
                result = await deleteForumPostHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_create_text_channel":
                result = await createTextChannelHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_delete_channel":
                result = await deleteChannelHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_read_messages":
                result = await readMessagesHandler(toolArgs, this.toolContext!);
                break;

              case "discord_get_server_info":
                result = await getServerInfoHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_add_reaction":
                result = await addReactionHandler(toolArgs, this.toolContext!);
                break;

              case "discord_add_multiple_reactions":
                result = await addMultipleReactionsHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_remove_reaction":
                result = await removeReactionHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_delete_message":
                result = await deleteMessageHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_create_webhook":
                result = await createWebhookHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_send_webhook_message":
                result = await sendWebhookMessageHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              case "discord_edit_webhook":
                result = await editWebhookHandler(toolArgs, this.toolContext!);
                break;

              case "discord_delete_webhook":
                result = await deleteWebhookHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;
              case "discord_create_category":
                result = await createCategoryHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;
              case "discord_edit_category":
                result = await editCategoryHandler(toolArgs, this.toolContext!);
                break;
              case "discord_delete_category":
                result = await deleteCategoryHandler(
                  toolArgs,
                  this.toolContext!,
                );
                break;

              default:
                return res.status(400).json({
                  jsonrpc: "2.0",
                  error: {
                    code: -32601,
                    message: `Unknown tool: ${toolName}`,
                  },
                  id: req.body?.id || null,
                });
            }
            break;

          default:
            // For method 'ping' and other non-critical methods, just return an empty result
            // This ensures MCP compatibility for health checks and probes
            if (method === "ping") {
              info(`Returning empty response for ping request`);
              result = {};
            } else {
              // For other unknown methods, return method not found error
              return res.status(400).json({
                jsonrpc: "2.0",
                error: {
                  code: -32601,
                  message: `Method not found: ${method}`,
                },
                id: req.body?.id || null,
              });
            }
        }

        info(`Request for ${method} handled successfully`);

        // Handle the case where tool handlers return { content, isError }
        if (result && typeof result === "object" && "content" in result) {
          // If it's an error from the tool handler
          if ("isError" in result && result.isError) {
            error(`Tool error response: ${JSON.stringify(result)}`);
            return res.json({
              jsonrpc: "2.0",
              id: req.body.id,
              error: {
                code: -32603,
                message: Array.isArray(result.content)
                  ? result.content.map((item: any) => item.text).join(" ")
                  : "Tool execution error",
              },
            });
          }

          // Return success result but maintain same format as other RPC methods
          const finalResponse = {
            jsonrpc: "2.0",
            id: req.body.id,
            result: result,
          };
          info(
            `Sending response (session ${this.sessionId}): ${JSON.stringify(finalResponse)}`,
          );
          return res.json(finalResponse);
        }

        // Standard result format
        const finalResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          result: result,
        };
        info(
          `Sending response (session ${this.sessionId}): ${JSON.stringify(finalResponse)}`,
        );
        return res.json(finalResponse);
      } catch (err) {
        error("Error processing tool request: " + String(err));
        // Handle validation errors
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          err.name === "ZodError"
        ) {
          return res.json({
            jsonrpc: "2.0",
            error: {
              code: -32602,
              message: `Invalid parameters: ${err && typeof err === "object" && "message" in err ? String((err as any).message) : "Unknown validation error"}`,
            },
            id: req.body?.id || null,
          });
        }
        // Handle all other errors
        return res.json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : "Unknown error",
          },
          id: req.body?.id || null,
        });
      }
    } catch (err) {
      error("Error handling MCP request: " + String(err));
      if (!res.headersSent) {
        res.json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message:
              err instanceof Error ? err.message : "Internal server error",
          },
          id: req.body?.id || null,
        });
      }
    }
  }

  async start(server: Server): Promise<void> {
    this.server = server;
    info("Starting HTTP transport with server: " + String(!!this.server));

    // Try to get client from the DiscordMCPServer instance
    // First, check if the server is passed from DiscordMCPServer
    if (server) {
      // Try to access client directly from server._context
      const anyServer = server as any;
      let client: Client | undefined;

      if (anyServer._context?.client) {
        client = anyServer._context.client;
        info("Found client in server._context");
      }
      // Also check if the server object has client directly
      else if (anyServer.client instanceof Client) {
        client = anyServer.client;
        info("Found client directly on server object");
      }
      // Look in parent object if available
      else if (anyServer._parent?.client instanceof Client) {
        client = anyServer._parent.client;
        info("Found client in server._parent");
      }

      if (client) {
        this.toolContext = createToolContext(client);
        info("Tool context initialized with Discord client");
      } else {
        // Create a real Discord client instead of a dummy
        info("Creating new Discord client for transport");
        const newClient = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions,
          ],
        });
        this.toolContext = createToolContext(newClient);
        info("Tool context initialized with new Discord client");
      }
    }

    // Create a stateless transport
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // set to undefined for stateless servers
    });

    // Connect the transport
    await this.server.connect(this.transport);
    info("Transport connected");

    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, "0.0.0.0", () => {
        info(`MCP Server listening on 0.0.0.0:${this.port}`);
        info("Server is ready to accept requests");
        resolve();
      });

      // Also resolve after a short delay to ensure we don't hang
      setTimeout(() => {
        if (!this.httpServer?.listening) {
          info("Server startup timeout fallback triggered");
          resolve();
        }
      }, 5000);
    });
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }

    if (this.server) {
      await this.server.close();
      this.server = null;
    }

    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          info("HTTP server closed");
          this.httpServer = null;
          resolve();
        });
      });
    }
  }

  // Health check methods for Smithery deployment
  private getHealthStatus() {
    return configManager.getHealthStatus();
  }

  private getConfigSummary() {
    return configManager.getConfigSummary();
  }

  private getMissingRequirements() {
    return configManager.getMissingRequirements();
  }

  private isConfigured() {
    return configManager.isConfigured();
  }
}
