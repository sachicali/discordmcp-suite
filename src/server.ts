/**
 * @fileoverview MCP Discord Server - Main server implementation for Discord management tools
 * @description This file contains the core DiscordMCPServer class that implements the Model Context Protocol
 * for Discord server management. It provides 58+ enterprise-level Discord management tools including
 * channel management, user administration, role-based access control, content moderation, and more.
 *
 * @author MCP Discord Server Team
 * @version 1.0.0
 * @license MIT
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "discord.js";
import { z } from "zod";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
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
  sendMessageHandler,
  getForumChannelsHandler,
  createForumPostHandler,
  getForumPostHandler,
  replyToForumHandler,
  deleteForumPostHandler,
  createTextChannelHandler,
  createForumChannelHandler,
  editChannelHandler,
  deleteChannelHandler,
  readMessagesHandler,
  getServerInfoHandler,
  createCategoryHandler,
  editCategoryHandler,
  deleteCategoryHandler,
  listServersHandler,
  createChannelUnderCategoryHandler,
  moveChannelToCategoryHandler,
  updateServerSettingsHandler,
  updateServerEngagementHandler,
  updateWelcomeScreenHandler,
  createEmojiHandler,
  deleteEmojiHandler,
  listEmojisHandler,
  createStickerHandler,
  deleteStickerHandler,
  listStickersHandler,
  createInviteHandler,
  deleteInviteHandler,
  listInvitesHandler,
  listIntegrationsHandler,
  deleteIntegrationHandler,
  createSoundboardSoundHandler,
  deleteSoundboardSoundHandler,
  listSoundboardSoundsHandler,
  getUserInfoHandler,
  getGuildMemberHandler,
  listGuildMembersHandler,
  addRoleToMemberHandler,
  removeRoleFromMemberHandler,
  kickMemberHandler,
  banMemberHandler,
  unbanMemberHandler,
  timeoutMemberHandler,
  createRoleHandler,
  editRoleHandler,
  deleteRoleHandler,
  listRolesHandler,
  getRolePermissionsHandler,
  addReactionHandler,
  addMultipleReactionsHandler,
  removeReactionHandler,
  deleteMessageHandler,
  createWebhookHandler,
  sendWebhookMessageHandler,
  editWebhookHandler,
  deleteWebhookHandler,
  listWebhooksHandler,
  sendDirectMessageHandler,
  getDirectMessagesHandler,
} from "./tools/tools.js";
import { MCPTransport } from "./transport.js";
import { info } from "./logger.js";

/**
 * @class DiscordMCPServer
 * @description Main MCP server class for Discord management operations.
 * Implements the Model Context Protocol to provide 58+ Discord management tools
 * including channel management, user administration, role-based access control,
 * content moderation, and enterprise server management features.
 *
 * @example
 * ```typescript
 * const client = new Client({ intents: [] });
 * const transport = new MCPTransport();
 * const server = new DiscordMCPServer(client, transport);
 * await server.start();
 * ```
 */
export class DiscordMCPServer {
  /** @private MCP server instance */
  private server: Server;

  /** @private Tool execution context with Discord client */
  private toolContext: ReturnType<typeof createToolContext>;

  /** @private Interval for periodic client status logging */
  private clientStatusInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new Discord MCP server instance
   * @param client - Discord.js client instance
   * @param transport - MCP transport layer for communication
   */
  constructor(
    private client: Client,
    private transport: MCPTransport,
  ) {
    this.server = new Server(
      {
        name: "MCP-Discord",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.toolContext = createToolContext(client);
    this.setupHandlers();
  }

  private setupHandlers() {
    // Set up the tool list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: toolList,
      };
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let toolResponse;
        switch (name) {
          case "discord_create_category":
            toolResponse = await createCategoryHandler(args, this.toolContext);
            return toolResponse;
          case "discord_edit_category":
            toolResponse = await editCategoryHandler(args, this.toolContext);
            return toolResponse;
          case "discord_delete_category":
            toolResponse = await deleteCategoryHandler(args, this.toolContext);
            return toolResponse;

          case "discord_login":
            toolResponse = await loginHandler(args, this.toolContext);
            this.logClientState("after discord_login handler");
            return toolResponse;

          case "discord_set_token":
            toolResponse = await setTokenHandler(args, this.toolContext);
            return toolResponse;

          case "discord_validate_token":
            toolResponse = await validateTokenHandler(args, this.toolContext);
            return toolResponse;

          case "discord_login_status":
            toolResponse = await loginStatusHandler(args, this.toolContext);
            return toolResponse;

          case "discord_logout":
            toolResponse = await logoutHandler(args, this.toolContext);
            this.logClientState("after discord_logout handler");
            return toolResponse;

          case "discord_update_config":
            toolResponse = await updateConfigHandler(args, this.toolContext);
            return toolResponse;

          case "discord_health_check":
            toolResponse = await healthCheckHandler(args, this.toolContext);
            return toolResponse;

          case "discord_send":
            this.logClientState("before discord_send handler");
            toolResponse = await sendMessageHandler(args, this.toolContext);
            return toolResponse;

          case "discord_get_forum_channels":
            this.logClientState("before discord_get_forum_channels handler");
            toolResponse = await getForumChannelsHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_create_forum_post":
            this.logClientState("before discord_create_forum_post handler");
            toolResponse = await createForumPostHandler(args, this.toolContext);
            return toolResponse;

          case "discord_get_forum_post":
            this.logClientState("before discord_get_forum_post handler");
            toolResponse = await getForumPostHandler(args, this.toolContext);
            return toolResponse;

          case "discord_reply_to_forum":
            this.logClientState("before discord_reply_to_forum handler");
            toolResponse = await replyToForumHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_forum_post":
            this.logClientState("before discord_delete_forum_post handler");
            toolResponse = await deleteForumPostHandler(args, this.toolContext);
            return toolResponse;

          case "discord_create_text_channel":
            this.logClientState("before discord_create_text_channel handler");
            toolResponse = await createTextChannelHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_create_forum_channel":
            this.logClientState("before discord_create_forum_channel handler");
            toolResponse = await createForumChannelHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_edit_channel":
            this.logClientState("before discord_edit_channel handler");
            toolResponse = await editChannelHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_channel":
            this.logClientState("before discord_delete_channel handler");
            toolResponse = await deleteChannelHandler(args, this.toolContext);
            return toolResponse;

          case "discord_read_messages":
            this.logClientState("before discord_read_messages handler");
            toolResponse = await readMessagesHandler(args, this.toolContext);
            return toolResponse;

          case "discord_get_server_info":
            this.logClientState("before discord_get_server_info handler");
            toolResponse = await getServerInfoHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_servers":
            this.logClientState("before discord_list_servers handler");
            toolResponse = await listServersHandler(args, this.toolContext);
            return toolResponse;

          case "discord_create_channel_under_category":
            this.logClientState(
              "before discord_create_channel_under_category handler",
            );
            toolResponse = await createChannelUnderCategoryHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_move_channel_to_category":
            this.logClientState(
              "before discord_move_channel_to_category handler",
            );
            toolResponse = await moveChannelToCategoryHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_add_reaction":
            this.logClientState("before discord_add_reaction handler");
            toolResponse = await addReactionHandler(args, this.toolContext);
            return toolResponse;

          case "discord_add_multiple_reactions":
            this.logClientState(
              "before discord_add_multiple_reactions handler",
            );
            toolResponse = await addMultipleReactionsHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_remove_reaction":
            this.logClientState("before discord_remove_reaction handler");
            toolResponse = await removeReactionHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_message":
            this.logClientState("before discord_delete_message handler");
            toolResponse = await deleteMessageHandler(args, this.toolContext);
            return toolResponse;

          case "discord_create_webhook":
            this.logClientState("before discord_create_webhook handler");
            toolResponse = await createWebhookHandler(args, this.toolContext);
            return toolResponse;

          case "discord_send_webhook_message":
            this.logClientState("before discord_send_webhook_message handler");
            toolResponse = await sendWebhookMessageHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_edit_webhook":
            this.logClientState("before discord_edit_webhook handler");
            toolResponse = await editWebhookHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_webhook":
            this.logClientState("before discord_delete_webhook handler");
            toolResponse = await deleteWebhookHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_webhooks":
            this.logClientState("before discord_list_webhooks handler");
            toolResponse = await listWebhooksHandler(args, this.toolContext);
            return toolResponse;

          case "discord_get_user_info":
            this.logClientState("before discord_get_user_info handler");
            toolResponse = await getUserInfoHandler(args, this.toolContext);
            return toolResponse;

          case "discord_get_guild_member":
            this.logClientState("before discord_get_guild_member handler");
            toolResponse = await getGuildMemberHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_guild_members":
            this.logClientState("before discord_list_guild_members handler");
            toolResponse = await listGuildMembersHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_add_role_to_member":
            this.logClientState("before discord_add_role_to_member handler");
            toolResponse = await addRoleToMemberHandler(args, this.toolContext);
            return toolResponse;

          case "discord_remove_role_from_member":
            this.logClientState(
              "before discord_remove_role_from_member handler",
            );
            toolResponse = await removeRoleFromMemberHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_kick_member":
            this.logClientState("before discord_kick_member handler");
            toolResponse = await kickMemberHandler(args, this.toolContext);
            return toolResponse;

          case "discord_ban_member":
            this.logClientState("before discord_ban_member handler");
            toolResponse = await banMemberHandler(args, this.toolContext);
            return toolResponse;

          case "discord_unban_member":
            this.logClientState("before discord_unban_member handler");
            toolResponse = await unbanMemberHandler(args, this.toolContext);
            return toolResponse;

          case "discord_timeout_member":
            this.logClientState("before discord_timeout_member handler");
            toolResponse = await timeoutMemberHandler(args, this.toolContext);
            return toolResponse;

          case "discord_create_role":
            this.logClientState("before discord_create_role handler");
            toolResponse = await createRoleHandler(args, this.toolContext);
            return toolResponse;

          case "discord_edit_role":
            this.logClientState("before discord_edit_role handler");
            toolResponse = await editRoleHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_role":
            this.logClientState("before discord_delete_role handler");
            toolResponse = await deleteRoleHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_roles":
            this.logClientState("before discord_list_roles handler");
            toolResponse = await listRolesHandler(args, this.toolContext);
            return toolResponse;

          case "discord_get_role_permissions":
            this.logClientState("before discord_get_role_permissions handler");
            toolResponse = await getRolePermissionsHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_send_direct_message":
            this.logClientState("before discord_send_direct_message handler");
            toolResponse = await sendDirectMessageHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_get_direct_messages":
            this.logClientState("before discord_get_direct_messages handler");
            toolResponse = await getDirectMessagesHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_update_server_settings":
            this.logClientState(
              "before discord_update_server_settings handler",
            );
            toolResponse = await updateServerSettingsHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_update_server_engagement":
            this.logClientState(
              "before discord_update_server_engagement handler",
            );
            toolResponse = await updateServerEngagementHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_update_welcome_screen":
            this.logClientState("before discord_update_welcome_screen handler");
            toolResponse = await updateWelcomeScreenHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_create_emoji":
            this.logClientState("before discord_create_emoji handler");
            toolResponse = await createEmojiHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_emoji":
            this.logClientState("before discord_delete_emoji handler");
            toolResponse = await deleteEmojiHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_emojis":
            this.logClientState("before discord_list_emojis handler");
            toolResponse = await listEmojisHandler(args, this.toolContext);
            return toolResponse;

          case "discord_create_sticker":
            this.logClientState("before discord_create_sticker handler");
            toolResponse = await createStickerHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_sticker":
            this.logClientState("before discord_delete_sticker handler");
            toolResponse = await deleteStickerHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_stickers":
            this.logClientState("before discord_list_stickers handler");
            toolResponse = await listStickersHandler(args, this.toolContext);
            return toolResponse;

          case "discord_create_invite":
            this.logClientState("before discord_create_invite handler");
            toolResponse = await createInviteHandler(args, this.toolContext);
            return toolResponse;

          case "discord_delete_invite":
            this.logClientState("before discord_delete_invite handler");
            toolResponse = await deleteInviteHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_invites":
            this.logClientState("before discord_list_invites handler");
            toolResponse = await listInvitesHandler(args, this.toolContext);
            return toolResponse;

          case "discord_list_integrations":
            this.logClientState("before discord_list_integrations handler");
            toolResponse = await listIntegrationsHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_delete_integration":
            this.logClientState("before discord_delete_integration handler");
            toolResponse = await deleteIntegrationHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_create_soundboard_sound":
            this.logClientState(
              "before discord_create_soundboard_sound handler",
            );
            toolResponse = await createSoundboardSoundHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_delete_soundboard_sound":
            this.logClientState(
              "before discord_delete_soundboard_sound handler",
            );
            toolResponse = await deleteSoundboardSoundHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          case "discord_list_soundboard_sounds":
            this.logClientState(
              "before discord_list_soundboard_sounds handler",
            );
            toolResponse = await listSoundboardSoundsHandler(
              args,
              this.toolContext,
            );
            return toolResponse;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid arguments: ${err.errors
                  .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
                  .join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        return {
          content: [
            { type: "text", text: `Error executing tool: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    });
  }

  private logClientState(context: string) {
    info(
      `Discord client state [${context}]: ${JSON.stringify({
        isReady: this.client.isReady(),
        hasToken: !!this.client.token,
        user: this.client.user
          ? {
              id: this.client.user.id,
              tag: this.client.user.tag,
            }
          : null,
      })}`,
    );
  }

  async start() {
    // Add client to server context so transport can access it
    (this.server as any)._context = { client: this.client };
    (this.server as any).client = this.client;

    // Setup periodic client state logging
    this.clientStatusInterval = setInterval(() => {
      this.logClientState("periodic check");
    }, 10000);

    await this.transport.start(this.server);
  }

  async stop() {
    // Clear the periodic check interval
    if (this.clientStatusInterval) {
      clearInterval(this.clientStatusInterval);
      this.clientStatusInterval = null;
    }

    await this.transport.stop();
  }
}
