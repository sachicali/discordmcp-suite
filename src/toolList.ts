import { configManager } from "./config.js";
import { info } from "./logger.js";

// Get current configuration to filter tools based on feature flags
const config = configManager.getConfig();

// Base tools that are always available (core functionality)
const baseTools = [
  {
    name: "discord_create_category",
    description: "Creates a new category in a Discord server.",
    displayName: "📁 Create Category",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        position: { type: "number" },
        reason: { type: "string" },
      },
      required: ["guildId", "name"],
    },
  },
  {
    name: "discord_edit_category",
    description: "Edits an existing Discord category (name and position).",
    displayName: "✏️ Edit Category",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: { type: "string" },
        name: { type: "string" },
        position: { type: "number" },
        reason: { type: "string" },
      },
      required: ["categoryId"],
    },
  },
  {
    name: "discord_delete_category",
    description: "Deletes a Discord category by ID.",
    displayName: "🗑️ Delete Category",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["categoryId"],
    },
  },
  {
    name: "discord_login",
    description: "Logs in to Discord using the configured token",
    displayName: "🔐 Discord Login",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "discord_set_token",
    description: "Sets and saves a Discord bot token for authentication",
    displayName: "🔑 Set Discord Token",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string" },
      },
      required: ["token"],
    },
  },
  {
    name: "discord_validate_token",
    description: "Validates the format and basic structure of a Discord token",
    displayName: "✅ Validate Token",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_login_status",
    description:
      "Shows current login status, configuration, and health information",
    displayName: "📊 Login Status",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_logout",
    description: "Logs out from Discord and disconnects the client",
    displayName: "🚪 Discord Logout",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_update_config",
    description: "Updates server configuration settings at runtime",
    displayName: "⚙️ Update Config",
    inputSchema: {
      type: "object",
      properties: {
        ALLOW_GUILD_IDS: { type: "array", items: { type: "string" } },
        ALLOW_CHANNEL_IDS: { type: "array", items: { type: "string" } },
        ENABLE_USER_MANAGEMENT: { type: "boolean" },
        ENABLE_VOICE_CHANNELS: { type: "boolean" },
        ENABLE_DIRECT_MESSAGES: { type: "boolean" },
        ENABLE_SERVER_MANAGEMENT: { type: "boolean" },
        ENABLE_RBAC: { type: "boolean" },
        ENABLE_CONTENT_MANAGEMENT: { type: "boolean" },
        TRANSPORT: { type: "string", enum: ["stdio", "http"] },
        HTTP_PORT: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "discord_health_check",
    description:
      "Performs a comprehensive health check of the Discord MCP server",
    displayName: "🩺 Health Check",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_send",
    description: "Sends a message to a specified Discord text channel",
    displayName: "💬 Send Message",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        message: { type: "string" },
      },
      required: ["channelId", "message"],
    },
  },
  {
    name: "discord_get_forum_channels",
    description:
      "Lists all forum channels in a specified Discord server (guild)",
    displayName: "📋 List Forum Channels",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_create_forum_post",
    description:
      "Creates a new post in a Discord forum channel with optional tags",
    displayName: "📝 Create Forum Post",
    inputSchema: {
      type: "object",
      properties: {
        forumChannelId: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        tags: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["forumChannelId", "title", "content"],
    },
  },
  {
    name: "discord_get_forum_post",
    description: "Retrieves details about a forum post including its messages",
    displayName: "📖 Get Forum Post",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string" },
      },
      required: ["threadId"],
    },
  },
  {
    name: "discord_reply_to_forum",
    description: "Adds a reply to an existing forum post or thread",
    displayName: "💬 Reply to Forum",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string" },
        message: { type: "string" },
      },
      required: ["threadId", "message"],
    },
  },
  {
    name: "discord_create_text_channel",
    description:
      "Creates a new text channel in a Discord server with an optional topic",
    displayName: "💬 Create Text Channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelName: { type: "string" },
        topic: { type: "string" },
      },
      required: ["guildId", "channelName"],
    },
  },
  {
    name: "discord_create_forum_channel",
    description: "Creates a new forum channel in a Discord server",
    displayName: "📋 Create Forum Channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelName: { type: "string" },
        topic: { type: "string" },
        categoryId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "channelName"],
    },
  },
  {
    name: "discord_edit_channel",
    description: "Edits an existing Discord channel (name, topic, category)",
    displayName: "✏️ Edit Channel",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        name: { type: "string" },
        topic: { type: "string" },
        categoryId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["channelId"],
    },
  },
  {
    name: "discord_delete_channel",
    description: "Deletes a Discord channel with an optional reason",
    displayName: "🗑️ Delete Channel",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["channelId"],
    },
  },
  {
    name: "discord_read_messages",
    description:
      "Retrieves messages from a Discord text channel with a configurable limit",
    displayName: "📖 Read Messages",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 50,
        },
      },
      required: ["channelId"],
    },
  },
  {
    name: "discord_get_server_info",
    description:
      "Retrieves detailed information about a Discord server including channels and member count",
    displayName: "🏰 Get Server Info",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_list_servers",
    description: "Lists all Discord servers that the bot has access to",
    displayName: "🏰 List Servers",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_create_channel_under_category",
    description:
      "Creates a new channel (text, voice, or forum) and places it under a specific category",
    displayName: "📁➕ Create Channel in Category",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelName: { type: "string" },
        channelType: {
          type: "string",
          enum: ["text", "voice", "forum"],
        },
        categoryId: { type: "string" },
        topic: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "channelName", "channelType", "categoryId"],
    },
  },
  {
    name: "discord_move_channel_to_category",
    description: "Moves an existing channel to a different category",
    displayName: "📁↔️ Move Channel to Category",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        categoryId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["channelId", "categoryId"],
    },
  },
  {
    name: "discord_add_reaction",
    description: "Adds an emoji reaction to a specific Discord message",
    displayName: "😀 Add Reaction",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        emoji: { type: "string" },
      },
      required: ["channelId", "messageId", "emoji"],
    },
  },
  {
    name: "discord_add_multiple_reactions",
    description: "Adds multiple emoji reactions to a Discord message at once",
    displayName: "😀✨ Add Multiple Reactions",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        emojis: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["channelId", "messageId", "emojis"],
    },
  },
  {
    name: "discord_remove_reaction",
    description: "Removes a specific emoji reaction from a Discord message",
    displayName: "🚫 Remove Reaction",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        emoji: { type: "string" },
        userId: { type: "string" },
      },
      required: ["channelId", "messageId", "emoji"],
    },
  },
  {
    name: "discord_delete_forum_post",
    description: "Deletes a forum post or thread with an optional reason",
    displayName: "🗑️ Delete Forum Post",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["threadId"],
    },
  },
  {
    name: "discord_delete_message",
    description: "Deletes a specific message from a Discord text channel",
    displayName: "🗑️ Delete Message",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["channelId", "messageId"],
    },
  },
  {
    name: "discord_create_webhook",
    description: "Creates a new webhook for a Discord channel",
    displayName: "🪝 Create Webhook",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        name: { type: "string" },
        avatar: { type: "string" },
        reason: { type: "string" },
      },
      required: ["channelId", "name"],
    },
  },
  {
    name: "discord_send_webhook_message",
    description: "Sends a message to a Discord channel using a webhook",
    displayName: "🪝💬 Send Webhook Message",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "string" },
        webhookToken: { type: "string" },
        content: { type: "string" },
        username: { type: "string" },
        avatarURL: { type: "string" },
        threadId: { type: "string" },
      },
      required: ["webhookId", "webhookToken", "content"],
    },
  },
  {
    name: "discord_edit_webhook",
    description: "Edits an existing webhook for a Discord channel",
    displayName: "🪝✏️ Edit Webhook",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "string" },
        webhookToken: { type: "string" },
        name: { type: "string" },
        avatar: { type: "string" },
        channelId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["webhookId"],
    },
  },
  {
    name: "discord_delete_webhook",
    description: "Deletes an existing webhook for a Discord channel",
    displayName: "🪝🗑️ Delete Webhook",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "string" },
        webhookToken: { type: "string" },
        reason: { type: "string" },
      },
      required: ["webhookId"],
    },
  },
  {
    name: "discord_list_webhooks",
    description: "Lists all webhooks for a Discord server or specific channel",
    displayName: "🪝📋 List Webhooks",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_get_user_info",
    description: "Retrieves information about a Discord user",
    displayName: "👤 Get User Info",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
      },
      required: ["userId"],
    },
  },
  {
    name: "discord_get_guild_member",
    description:
      "Retrieves information about a guild member including roles and permissions",
    displayName: "👥 Get Guild Member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
      },
      required: ["guildId", "userId"],
    },
  },
  {
    name: "discord_list_guild_members",
    description: "Lists all members in a Discord server",
    displayName: "👥📋 List Guild Members",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_add_role_to_member",
    description: "Adds a role to a guild member",
    displayName: "🏷️➕ Add Role to Member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        roleId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "userId", "roleId"],
    },
  },
  {
    name: "discord_remove_role_from_member",
    description: "Removes a role from a guild member",
    displayName: "🏷️➖ Remove Role from Member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        roleId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "userId", "roleId"],
    },
  },
  {
    name: "discord_kick_member",
    description: "Kicks a member from the Discord server",
    displayName: "👢 Kick Member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "userId"],
    },
  },
  {
    name: "discord_ban_member",
    description: "Bans a member from the Discord server",
    displayName: "🔨 Ban Member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        reason: { type: "string" },
        deleteMessageDays: {
          type: "number",
          minimum: 0,
          maximum: 7,
          default: 0,
        },
      },
      required: ["guildId", "userId"],
    },
  },
  {
    name: "discord_unban_member",
    description: "Unbans a user from the Discord server",
    displayName: "🔓 Unban Member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "userId"],
    },
  },
  {
    name: "discord_timeout_member",
    description: "Times out or removes timeout from a guild member",
    displayName: "⏰ Timeout Member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        durationMinutes: { type: "number", minimum: 0 },
        reason: { type: "string" },
      },
      required: ["guildId", "userId"],
    },
  },
  {
    name: "discord_create_role",
    description:
      "Creates a new role in a Discord server with specified permissions",
    displayName: "🏷️ Create Role",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        color: { type: "number" },
        hoist: { type: "boolean" },
        mentionable: { type: "boolean" },
        permissions: {
          type: "array",
          items: { type: "string" },
        },
        reason: { type: "string" },
      },
      required: ["guildId", "name"],
    },
  },
  {
    name: "discord_edit_role",
    description: "Edits an existing role's properties and permissions",
    displayName: "🏷️✏️ Edit Role",
    inputSchema: {
      type: "object",
      properties: {
        roleId: { type: "string" },
        name: { type: "string" },
        color: { type: "number" },
        hoist: { type: "boolean" },
        mentionable: { type: "boolean" },
        permissions: {
          type: "array",
          items: { type: "string" },
        },
        reason: { type: "string" },
      },
      required: ["roleId"],
    },
  },
  {
    name: "discord_delete_role",
    description: "Deletes a role from the Discord server",
    displayName: "🏷️🗑️ Delete Role",
    inputSchema: {
      type: "object",
      properties: {
        roleId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["roleId"],
    },
  },
  {
    name: "discord_list_roles",
    description: "Lists all roles in a Discord server with their properties",
    displayName: "🏷️📋 List Roles",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_get_role_permissions",
    description: "Gets the permissions for a specific role",
    displayName: "🏷️🔍 Get Role Permissions",
    inputSchema: {
      type: "object",
      properties: {
        roleId: { type: "string" },
      },
      required: ["roleId"],
    },
  },
  {
    name: "discord_send_direct_message",
    description: "Sends a direct message to a Discord user",
    displayName: "📧 Send Direct Message",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        message: { type: "string" },
      },
      required: ["userId", "message"],
    },
  },
  {
    name: "discord_get_direct_messages",
    description: "Retrieves direct message history with a specific user",
    displayName: "📧📖 Get Direct Messages",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 50,
        },
      },
      required: ["userId"],
    },
  },
  {
    name: "discord_update_server_settings",
    description:
      "Updates various server settings like name, description, icon, etc.",
    displayName: "🏰⚙️ Update Server Settings",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        icon: { type: "string" },
        banner: { type: "string" },
        splash: { type: "string" },
        discoverySplash: { type: "string" },
        afkChannelId: { type: "string" },
        afkTimeout: { type: "number" },
        defaultMessageNotifications: {
          type: "string",
          enum: ["ALL_MESSAGES", "ONLY_MENTIONS"],
        },
        explicitContentFilter: {
          type: "string",
          enum: ["DISABLED", "MEMBERS_WITHOUT_ROLES", "ALL_MEMBERS"],
        },
        verificationLevel: {
          type: "string",
          enum: ["NONE", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
        },
        reason: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_update_server_engagement",
    description:
      "Updates server engagement settings like system messages and rules",
    displayName: "🏰🎯 Update Server Engagement",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        systemChannelId: { type: "string" },
        systemChannelFlags: {
          type: "array",
          items: { type: "string" },
        },
        rulesChannelId: { type: "string" },
        publicUpdatesChannelId: { type: "string" },
        preferredLocale: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_update_welcome_screen",
    description: "Updates the server's welcome screen settings",
    displayName: "🏰🎉 Update Welcome Screen",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        enabled: { type: "boolean" },
        welcomeChannels: {
          type: "array",
          items: {
            type: "object",
            properties: {
              channelId: { type: "string" },
              description: { type: "string" },
              emojiId: { type: "string" },
              emojiName: { type: "string" },
            },
            required: ["channelId", "description"],
          },
        },
        description: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_create_emoji",
    description: "Creates a new emoji for the server",
    displayName: "😀➕ Create Emoji",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        image: { type: "string" },
        roles: {
          type: "array",
          items: { type: "string" },
        },
        reason: { type: "string" },
      },
      required: ["guildId", "name", "image"],
    },
  },
  {
    name: "discord_delete_emoji",
    description: "Deletes an emoji from the server",
    displayName: "😀🗑️ Delete Emoji",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        emojiId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "emojiId"],
    },
  },
  {
    name: "discord_list_emojis",
    description: "Lists all emojis in the server",
    displayName: "😀📋 List Emojis",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_create_sticker",
    description: "Creates a new sticker for the server",
    displayName: "🏷️➕ Create Sticker",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        tags: { type: "string" },
        file: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "name", "tags", "file"],
    },
  },
  {
    name: "discord_delete_sticker",
    description: "Deletes a sticker from the server",
    displayName: "🏷️🗑️ Delete Sticker",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        stickerId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "stickerId"],
    },
  },
  {
    name: "discord_list_stickers",
    description: "Lists all stickers in the server",
    displayName: "🏷️📋 List Stickers",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_create_invite",
    description: "Creates an invite for a channel",
    displayName: "🔗 Create Invite",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        maxAge: { type: "number" },
        maxUses: { type: "number" },
        temporary: { type: "boolean" },
        unique: { type: "boolean" },
        targetUserId: { type: "string" },
        targetApplicationId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["channelId"],
    },
  },
  {
    name: "discord_delete_invite",
    description: "Deletes an invite by code",
    displayName: "🔗🗑️ Delete Invite",
    inputSchema: {
      type: "object",
      properties: {
        inviteCode: { type: "string" },
        reason: { type: "string" },
      },
      required: ["inviteCode"],
    },
  },
  {
    name: "discord_list_invites",
    description: "Lists all invites for the server",
    displayName: "🔗📋 List Invites",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_list_integrations",
    description: "Lists all integrations for the server",
    displayName: "🔌📋 List Integrations",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_delete_integration",
    description: "Deletes an integration from the server",
    displayName: "🔌🗑️ Delete Integration",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        integrationId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "integrationId"],
    },
  },
  {
    name: "discord_create_soundboard_sound",
    description: "Creates a soundboard sound (not yet supported by Discord.js)",
    displayName: "🔊➕ Create Soundboard Sound",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        sound: { type: "string" },
        volume: { type: "number" },
        emojiId: { type: "string" },
        emojiName: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "name", "sound"],
    },
  },
  {
    name: "discord_delete_soundboard_sound",
    description: "Deletes a soundboard sound (not yet supported by Discord.js)",
    displayName: "🔊🗑️ Delete Soundboard Sound",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        soundId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "soundId"],
    },
  },
  {
    name: "discord_list_soundboard_sounds",
    description:
      "Lists all soundboard sounds (not yet supported by Discord.js)",
    displayName: "🔊📋 List Soundboard Sounds",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_create_voice_channel",
    description: "Creates a new voice channel in a Discord server",
    displayName: "🎤➕ Create Voice Channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelName: { type: "string" },
        categoryId: { type: "string" },
        userLimit: { type: "number", minimum: 0, maximum: 99, default: 0 },
        bitrate: {
          type: "number",
          minimum: 8000,
          maximum: 384000,
          default: 64000,
        },
        reason: { type: "string" },
      },
      required: ["guildId", "channelName"],
    },
  },
  {
    name: "discord_delete_voice_channel",
    description: "Deletes a voice channel from the Discord server",
    displayName: "🎤🗑️ Delete Voice Channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "channelId"],
    },
  },
  {
    name: "discord_edit_voice_channel",
    description: "Edits an existing voice channel's properties",
    displayName: "🎤✏️ Edit Voice Channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelId: { type: "string" },
        name: { type: "string" },
        userLimit: { type: "number", minimum: 0, maximum: 99 },
        bitrate: { type: "number", minimum: 8000, maximum: 384000 },
        categoryId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "channelId"],
    },
  },
  {
    name: "discord_list_voice_channels",
    description: "Lists all voice channels in a Discord server",
    displayName: "🎤📋 List Voice Channels",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
  {
    name: "discord_get_voice_channel_info",
    description: "Gets detailed information about a specific voice channel",
    displayName: "🎤ℹ️ Get Voice Channel Info",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelId: { type: "string" },
      },
      required: ["guildId", "channelId"],
    },
  },
  {
    name: "discord_move_user_to_voice_channel",
    description: "Moves a user to a different voice channel",
    displayName: "🎤↔️ Move User to Voice Channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        channelId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["guildId", "userId", "channelId"],
    },
  },
];

// User Management Tools (can be disabled via ENABLE_USER_MANAGEMENT=false)
const userManagementTools = [
  "discord_get_user_info",
  "discord_get_guild_member",
  "discord_list_guild_members",
  "discord_add_role_to_member",
  "discord_remove_role_from_member",
  "discord_kick_member",
  "discord_ban_member",
  "discord_unban_member",
  "discord_timeout_member",
];

// Voice Channel Tools (can be disabled via ENABLE_VOICE_CHANNELS=false)
const voiceChannelTools = [
  "discord_create_voice_channel",
  "discord_delete_voice_channel",
  "discord_edit_voice_channel",
  "discord_list_voice_channels",
  "discord_get_voice_channel_info",
  "discord_move_user_to_voice_channel",
];

// Direct Message Tools (can be disabled via ENABLE_DIRECT_MESSAGES=false)
const directMessageTools = [
  "discord_send_direct_message",
  "discord_get_direct_messages",
];

// Server Management Tools (can be disabled via ENABLE_SERVER_MANAGEMENT=false)
const serverManagementTools = [
  "discord_update_server_settings",
  "discord_update_server_engagement",
  "discord_update_welcome_screen",
  "discord_create_emoji",
  "discord_delete_emoji",
  "discord_list_emojis",
  "discord_create_sticker",
  "discord_delete_sticker",
  "discord_list_stickers",
  "discord_create_invite",
  "discord_delete_invite",
  "discord_list_invites",
  "discord_list_integrations",
  "discord_delete_integration",
  "discord_create_soundboard_sound",
  "discord_delete_soundboard_sound",
  "discord_list_soundboard_sounds",
];

// Role-Based Access Control Tools (can be disabled via ENABLE_RBAC=false)
const rbacTools = [
  "discord_create_role",
  "discord_edit_role",
  "discord_delete_role",
  "discord_list_roles",
  "discord_get_role_permissions",
];

// Content Management Tools (can be disabled via ENABLE_CONTENT_MANAGEMENT=false)
const contentManagementTools = [
  "discord_read_messages",
  "discord_add_reaction",
  "discord_add_multiple_reactions",
  "discord_remove_reaction",
  "discord_delete_message",
];

// Filter tools based on feature flags
function getFilteredTools() {
  const enabledToolNames = new Set<string>();

  // Always include core tools (login, basic channel/server operations)
  baseTools.forEach((tool) => {
    const toolName = tool.name;

    // Check if tool should be filtered based on feature flags
    if (
      (!config.ENABLE_USER_MANAGEMENT &&
        userManagementTools.includes(toolName)) ||
      (!config.ENABLE_VOICE_CHANNELS && voiceChannelTools.includes(toolName)) ||
      (!config.ENABLE_DIRECT_MESSAGES &&
        directMessageTools.includes(toolName)) ||
      (!config.ENABLE_SERVER_MANAGEMENT &&
        serverManagementTools.includes(toolName)) ||
      (!config.ENABLE_RBAC && rbacTools.includes(toolName)) ||
      (!config.ENABLE_CONTENT_MANAGEMENT &&
        contentManagementTools.includes(toolName))
    ) {
      // Tool is disabled by feature flag
      if (process.env.DEBUG_TOKEN) {
        info(`Tool filtered out due to feature flags: ${toolName}`);
      }
      return;
    }

    enabledToolNames.add(toolName);
  });

  // Filter the tools array based on enabled tools
  const filteredTools = baseTools.filter((tool) =>
    enabledToolNames.has(tool.name),
  );

  if (process.env.DEBUG_TOKEN) {
    info(
      `Feature flags applied - Total tools: ${baseTools.length}, Enabled tools: ${filteredTools.length}`,
    );
    info(
      `Feature flag status: USER_MGMT=${config.ENABLE_USER_MANAGEMENT}, VOICE=${config.ENABLE_VOICE_CHANNELS}, DM=${config.ENABLE_DIRECT_MESSAGES}, SERVER=${config.ENABLE_SERVER_MANAGEMENT}, RBAC=${config.ENABLE_RBAC}, CONTENT=${config.ENABLE_CONTENT_MANAGEMENT}`,
    );
  }

  return filteredTools;
}

// Export the filtered tool list
export const toolList = getFilteredTools();
