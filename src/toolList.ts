export const toolList = [
  {
    name: "discord_create_category",
    description: "Creates a new category in a Discord server.",
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
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_logout",
    description: "Logs out from Discord and disconnects the client",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_update_config",
    description: "Updates server configuration settings at runtime",
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
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "discord_send",
    description: "Sends a message to a specified Discord text channel",
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
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
      },
      required: ["guildId"],
    },
  },
];
