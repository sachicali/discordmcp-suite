import { configManager } from "./config.js";
import { info } from "./logger.js";

// Get current configuration to filter tools based on feature flags
const config = configManager.getConfig();

// Import all schemas for automatic tool generation
import {
  DiscordLoginSchema,
  SetTokenSchema,
  ValidateTokenSchema,
  LoginStatusSchema,
  LogoutSchema,
  SendMessageSchema,
  GetForumChannelsSchema,
  CreateForumPostSchema,
  GetForumPostSchema,
  ReplyToForumSchema,
  CreateTextChannelSchema,
  CreateForumChannelSchema,
  EditChannelSchema,
  DeleteChannelSchema,
  ReadMessagesSchema,
  GetServerInfoSchema,
  ListServersSchema,
  CreateChannelUnderCategorySchema,
  MoveChannelToCategorySchema,
  AddReactionSchema,
  AddMultipleReactionsSchema,
  RemoveReactionSchema,
  DeleteForumPostSchema,
  DeleteMessageSchema,
  CreateWebhookSchema,
  SendWebhookMessageSchema,
  EditWebhookSchema,
  DeleteWebhookSchema,
  ListWebhooksSchema,
  CreateCategorySchema,
  EditCategorySchema,
  DeleteCategorySchema,
  GetUserInfoSchema,
  GetGuildMemberSchema,
  ListGuildMembersSchema,
  AddRoleToMemberSchema,
  RemoveRoleFromMemberSchema,
  KickMemberSchema,
  BanMemberSchema,
  UnbanMemberSchema,
  TimeoutMemberSchema,
  CreateRoleSchema,
  EditRoleSchema,
  DeleteRoleSchema,
  ListRolesSchema,
  GetRolePermissionsSchema,
  SendDirectMessageSchema,
  GetDirectMessagesSchema,
  UpdateServerSettingsSchema,
  UpdateServerEngagementSchema,
  UpdateWelcomeScreenSchema,
  CreateEmojiSchema,
  DeleteEmojiSchema,
  ListEmojisSchema,
  CreateStickerSchema,
  DeleteStickerSchema,
  ListStickersSchema,
  CreateInviteSchema,
  DeleteInviteSchema,
  ListInvitesSchema,
  ListIntegrationsSchema,
  DeleteIntegrationSchema,
  CreateSoundboardSoundSchema,
  DeleteSoundboardSoundSchema,
  ListSoundboardSoundsSchema,
  CreateVoiceChannelSchema,
  DeleteVoiceChannelSchema,
  EditVoiceChannelSchema,
  ListVoiceChannelsSchema,
  GetVoiceChannelInfoSchema,
} from "./schemas.js";

// Tool definitions mapping schemas to MCP tool format
const toolDefinitions = [
  // Login & Authentication Tools
  {
    name: "discord_login",
    schema: DiscordLoginSchema,
    description: "Logs in to Discord using the configured token",
    displayName: "🔐 Discord Login",
  },
  {
    name: "discord_set_token",
    schema: SetTokenSchema,
    description: "Sets and saves a Discord bot token for authentication",
    displayName: "🔑 Set Discord Token",
  },
  {
    name: "discord_validate_token",
    schema: ValidateTokenSchema,
    description: "Validates the format and basic structure of a Discord token",
    displayName: "✅ Validate Token",
  },
  {
    name: "discord_login_status",
    schema: LoginStatusSchema,
    description:
      "Shows current login status, configuration, and health information",
    displayName: "📊 Login Status",
  },
  {
    name: "discord_logout",
    schema: LogoutSchema,
    description: "Logs out from Discord and disconnects the client",
    displayName: "🚪 Discord Logout",
  },

  // Messaging Tools
  {
    name: "discord_send",
    schema: SendMessageSchema,
    description: "Sends a message to a specified Discord text channel",
    displayName: "💬 Send Message",
  },
  {
    name: "discord_read_messages",
    schema: ReadMessagesSchema,
    description:
      "Retrieves messages from a Discord text channel with a configurable limit",
    displayName: "📖 Read Messages",
  },
  {
    name: "discord_delete_message",
    schema: DeleteMessageSchema,
    description: "Deletes a specific message from a Discord text channel",
    displayName: "🗑️ Delete Message",
  },

  // Forum Tools
  {
    name: "discord_get_forum_channels",
    schema: GetForumChannelsSchema,
    description:
      "Lists all forum channels in a specified Discord server (guild)",
    displayName: "📋 List Forum Channels",
  },
  {
    name: "discord_create_forum_post",
    schema: CreateForumPostSchema,
    description:
      "Creates a new post in a Discord forum channel with optional tags",
    displayName: "📝 Create Forum Post",
  },
  {
    name: "discord_get_forum_post",
    schema: GetForumPostSchema,
    description: "Retrieves details about a forum post including its messages",
    displayName: "📖 Get Forum Post",
  },
  {
    name: "discord_reply_to_forum",
    schema: ReplyToForumSchema,
    description: "Adds a reply to an existing forum post or thread",
    displayName: "💬 Reply to Forum",
  },
  {
    name: "discord_delete_forum_post",
    schema: DeleteForumPostSchema,
    description: "Deletes a forum post or thread with an optional reason",
    displayName: "🗑️ Delete Forum Post",
  },

  // Channel Management Tools
  {
    name: "discord_create_text_channel",
    schema: CreateTextChannelSchema,
    description:
      "Creates a new text channel in a Discord server with an optional topic",
    displayName: "💬 Create Text Channel",
  },
  {
    name: "discord_create_forum_channel",
    schema: CreateForumChannelSchema,
    description: "Creates a new forum channel in a Discord server",
    displayName: "📋 Create Forum Channel",
  },
  {
    name: "discord_edit_channel",
    schema: EditChannelSchema,
    description: "Edits an existing Discord channel (name, topic, category)",
    displayName: "✏️ Edit Channel",
  },
  {
    name: "discord_delete_channel",
    schema: DeleteChannelSchema,
    description: "Deletes a Discord channel with an optional reason",
    displayName: "🗑️ Delete Channel",
  },
  {
    name: "discord_create_channel_under_category",
    schema: CreateChannelUnderCategorySchema,
    description:
      "Creates a new channel (text, voice, or forum) and places it under a specific category",
    displayName: "📁➕ Create Channel in Category",
  },
  {
    name: "discord_move_channel_to_category",
    schema: MoveChannelToCategorySchema,
    description: "Moves an existing channel to a different category",
    displayName: "📁↔️ Move Channel to Category",
  },

  // Category Tools
  {
    name: "discord_create_category",
    schema: CreateCategorySchema,
    description: "Creates a new category in a Discord server",
    displayName: "📁 Create Category",
  },
  {
    name: "discord_edit_category",
    schema: EditCategorySchema,
    description: "Edits an existing Discord category (name and position)",
    displayName: "✏️ Edit Category",
  },
  {
    name: "discord_delete_category",
    schema: DeleteCategorySchema,
    description: "Deletes a Discord category by ID",
    displayName: "🗑️ Delete Category",
  },

  // Server Management Tools
  {
    name: "discord_get_server_info",
    schema: GetServerInfoSchema,
    description:
      "Retrieves detailed information about a Discord server including channels and member count",
    displayName: "🏰 Get Server Info",
  },
  {
    name: "discord_list_servers",
    schema: ListServersSchema,
    description: "Lists all Discord servers that the bot has access to",
    displayName: "🏰 List Servers",
  },
  {
    name: "discord_update_server_settings",
    schema: UpdateServerSettingsSchema,
    description:
      "Updates various server settings like name, description, icon, etc.",
    displayName: "🏰⚙️ Update Server Settings",
  },
  {
    name: "discord_update_server_engagement",
    schema: UpdateServerEngagementSchema,
    description:
      "Updates server engagement settings like system messages and rules",
    displayName: "🏰🎯 Update Server Engagement",
  },
  {
    name: "discord_update_welcome_screen",
    schema: UpdateWelcomeScreenSchema,
    description: "Updates the server's welcome screen settings",
    displayName: "🏰🎉 Update Welcome Screen",
  },

  // Reaction Tools
  {
    name: "discord_add_reaction",
    schema: AddReactionSchema,
    description: "Adds an emoji reaction to a specific Discord message",
    displayName: "😀 Add Reaction",
  },
  {
    name: "discord_add_multiple_reactions",
    schema: AddMultipleReactionsSchema,
    description: "Adds multiple emoji reactions to a Discord message at once",
    displayName: "😀✨ Add Multiple Reactions",
  },
  {
    name: "discord_remove_reaction",
    schema: RemoveReactionSchema,
    description: "Removes a specific emoji reaction from a Discord message",
    displayName: "🚫 Remove Reaction",
  },

  // Webhook Tools
  {
    name: "discord_create_webhook",
    schema: CreateWebhookSchema,
    description: "Creates a new webhook for a Discord channel",
    displayName: "🪝 Create Webhook",
  },
  {
    name: "discord_send_webhook_message",
    schema: SendWebhookMessageSchema,
    description: "Sends a message to a Discord channel using a webhook",
    displayName: "🪝💬 Send Webhook Message",
  },
  {
    name: "discord_edit_webhook",
    schema: EditWebhookSchema,
    description: "Edits an existing webhook for a Discord channel",
    displayName: "🪝✏️ Edit Webhook",
  },
  {
    name: "discord_delete_webhook",
    schema: DeleteWebhookSchema,
    description: "Deletes an existing webhook for a Discord channel",
    displayName: "🪝🗑️ Delete Webhook",
  },
  {
    name: "discord_list_webhooks",
    schema: ListWebhooksSchema,
    description: "Lists all webhooks for a Discord server or specific channel",
    displayName: "🪝📋 List Webhooks",
  },

  // User Management Tools
  {
    name: "discord_get_user_info",
    schema: GetUserInfoSchema,
    description: "Retrieves information about a Discord user",
    displayName: "👤 Get User Info",
  },
  {
    name: "discord_get_guild_member",
    schema: GetGuildMemberSchema,
    description:
      "Retrieves information about a guild member including roles and permissions",
    displayName: "👥 Get Guild Member",
  },
  {
    name: "discord_list_guild_members",
    schema: ListGuildMembersSchema,
    description: "Lists all members in a Discord server",
    displayName: "👥📋 List Guild Members",
  },
  {
    name: "discord_add_role_to_member",
    schema: AddRoleToMemberSchema,
    description: "Adds a role to a guild member",
    displayName: "🏷️➕ Add Role to Member",
  },
  {
    name: "discord_remove_role_from_member",
    schema: RemoveRoleFromMemberSchema,
    description: "Removes a role from a guild member",
    displayName: "🏷️➖ Remove Role from Member",
  },
  {
    name: "discord_kick_member",
    schema: KickMemberSchema,
    description: "Kicks a member from the Discord server",
    displayName: "👢 Kick Member",
  },
  {
    name: "discord_ban_member",
    schema: BanMemberSchema,
    description: "Bans a member from the Discord server",
    displayName: "🔨 Ban Member",
  },
  {
    name: "discord_unban_member",
    schema: UnbanMemberSchema,
    description: "Unbans a user from the Discord server",
    displayName: "🔓 Unban Member",
  },
  {
    name: "discord_timeout_member",
    schema: TimeoutMemberSchema,
    description: "Times out or removes timeout from a guild member",
    displayName: "⏰ Timeout Member",
  },

  // Role Management Tools
  {
    name: "discord_create_role",
    schema: CreateRoleSchema,
    description:
      "Creates a new role in a Discord server with specified permissions",
    displayName: "🏷️ Create Role",
  },
  {
    name: "discord_edit_role",
    schema: EditRoleSchema,
    description: "Edits an existing role's properties and permissions",
    displayName: "🏷️✏️ Edit Role",
  },
  {
    name: "discord_delete_role",
    schema: DeleteRoleSchema,
    description: "Deletes a role from the Discord server",
    displayName: "🏷️🗑️ Delete Role",
  },
  {
    name: "discord_list_roles",
    schema: ListRolesSchema,
    description: "Lists all roles in a Discord server with their properties",
    displayName: "🏷️📋 List Roles",
  },
  {
    name: "discord_get_role_permissions",
    schema: GetRolePermissionsSchema,
    description: "Gets the permissions for a specific role",
    displayName: "🏷️🔍 Get Role Permissions",
  },

  // Direct Message Tools
  {
    name: "discord_send_direct_message",
    schema: SendDirectMessageSchema,
    description: "Sends a direct message to a Discord user",
    displayName: "📧 Send Direct Message",
  },
  {
    name: "discord_get_direct_messages",
    schema: GetDirectMessagesSchema,
    description: "Retrieves direct message history with a specific user",
    displayName: "📧📖 Get Direct Messages",
  },

  // Emoji & Sticker Tools
  {
    name: "discord_create_emoji",
    schema: CreateEmojiSchema,
    description: "Creates a new emoji for the server",
    displayName: "😀➕ Create Emoji",
  },
  {
    name: "discord_delete_emoji",
    schema: DeleteEmojiSchema,
    description: "Deletes an emoji from the server",
    displayName: "😀🗑️ Delete Emoji",
  },
  {
    name: "discord_list_emojis",
    schema: ListEmojisSchema,
    description: "Lists all emojis in the server",
    displayName: "😀📋 List Emojis",
  },
  {
    name: "discord_create_sticker",
    schema: CreateStickerSchema,
    description: "Creates a new sticker for the server",
    displayName: "🏷️➕ Create Sticker",
  },
  {
    name: "discord_delete_sticker",
    schema: DeleteStickerSchema,
    description: "Deletes a sticker from the server",
    displayName: "🏷️🗑️ Delete Sticker",
  },
  {
    name: "discord_list_stickers",
    schema: ListStickersSchema,
    description: "Lists all stickers in the server",
    displayName: "🏷️📋 List Stickers",
  },

  // Invite & Integration Tools
  {
    name: "discord_create_invite",
    schema: CreateInviteSchema,
    description: "Creates an invite for a channel",
    displayName: "🔗 Create Invite",
  },
  {
    name: "discord_delete_invite",
    schema: DeleteInviteSchema,
    description: "Deletes an invite by code",
    displayName: "🔗🗑️ Delete Invite",
  },
  {
    name: "discord_list_invites",
    schema: ListInvitesSchema,
    description: "Lists all invites for the server",
    displayName: "🔗📋 List Invites",
  },
  {
    name: "discord_list_integrations",
    schema: ListIntegrationsSchema,
    description: "Lists all integrations for the server",
    displayName: "🔌📋 List Integrations",
  },
  {
    name: "discord_delete_integration",
    schema: DeleteIntegrationSchema,
    description: "Deletes an integration from the server",
    displayName: "🔌🗑️ Delete Integration",
  },

  // Soundboard Tools
  {
    name: "discord_create_soundboard_sound",
    schema: CreateSoundboardSoundSchema,
    description: "Creates a soundboard sound (not yet supported by Discord.js)",
    displayName: "🔊➕ Create Soundboard Sound",
  },
  {
    name: "discord_delete_soundboard_sound",
    schema: DeleteSoundboardSoundSchema,
    description: "Deletes a soundboard sound (not yet supported by Discord.js)",
    displayName: "🔊🗑️ Delete Soundboard Sound",
  },
  {
    name: "discord_list_soundboard_sounds",
    schema: ListSoundboardSoundsSchema,
    description:
      "Lists all soundboard sounds (not yet supported by Discord.js)",
    displayName: "🔊📋 List Soundboard Sounds",
  },

  // Voice Channel Tools
  {
    name: "discord_create_voice_channel",
    schema: CreateVoiceChannelSchema,
    description: "Creates a new voice channel in a Discord server",
    displayName: "🎤➕ Create Voice Channel",
  },
  {
    name: "discord_delete_voice_channel",
    schema: DeleteVoiceChannelSchema,
    description: "Deletes a voice channel from the Discord server",
    displayName: "🎤🗑️ Delete Voice Channel",
  },
  {
    name: "discord_edit_voice_channel",
    schema: EditVoiceChannelSchema,
    description: "Edits an existing voice channel's properties",
    displayName: "🎤✏️ Edit Voice Channel",
  },
  {
    name: "discord_list_voice_channels",
    schema: ListVoiceChannelsSchema,
    description: "Lists all voice channels in a Discord server",
    displayName: "🎤📋 List Voice Channels",
  },
  {
    name: "discord_get_voice_channel_info",
    schema: GetVoiceChannelInfoSchema,
    description: "Gets detailed information about a specific voice channel",
    displayName: "🎤ℹ️ Get Voice Channel Info",
  },
];

// Convert Zod schemas to JSON Schema format for MCP
function convertZodToJsonSchema(zodSchema: any): any {
  try {
    // Get the schema definition from Zod
    const def = zodSchema._def;

    if (def.typeName === "ZodObject") {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      // Get the shape by calling the shape function
      let shape: any = null;
      try {
        if (typeof def.shape === "function") {
          shape = def.shape();
        } else {
          shape = def.shape;
        }
      } catch (error) {
        console.warn(`Error accessing shape for ZodObject schema:`, error);
        return {
          type: "object",
          properties: {},
        };
      }

      // If we still don't have a shape, return empty object schema
      if (!shape) {
        console.warn(`Unable to access shape for ZodObject schema`);
        return {
          type: "object",
          properties: {},
        };
      }

      // Process each property in the object
      for (const [key, value] of Object.entries(shape)) {
        const propSchema = convertZodToJsonSchema(value as any);
        properties[key] = propSchema;

        // Check if property is required (not optional)
        if ((value as any)._def.typeName !== "ZodOptional") {
          required.push(key);
        }
      }

      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    if (def.typeName === "ZodString") {
      return {
        type: "string",
      };
    }

    if (def.typeName === "ZodNumber") {
      return {
        type: "number",
      };
    }

    if (def.typeName === "ZodBoolean") {
      return {
        type: "boolean",
      };
    }

    if (def.typeName === "ZodArray") {
      return {
        type: "array",
        items: convertZodToJsonSchema(def.type),
      };
    }

    if (def.typeName === "ZodOptional") {
      // For optional fields, return the inner schema without marking as required
      return convertZodToJsonSchema(def.innerType);
    }

    if (def.typeName === "ZodDefault") {
      // Handle default values
      const innerSchema = convertZodToJsonSchema(def.innerType);
      if (innerSchema.type === "number" || innerSchema.type === "string") {
        innerSchema.default = def.defaultValue();
      }
      return innerSchema;
    }

    if (def.typeName === "ZodEnum") {
      return {
        type: "string",
        enum: def.values,
      };
    }

    if (def.typeName === "ZodUnion") {
      // For unions, try to create a more specific schema
      const options = def.options.map((option: any) =>
        convertZodToJsonSchema(option),
      );
      // If all options are the same type, return that type
      const types = [...new Set(options.map((opt: any) => opt.type))];
      if (types.length === 1) {
        return options[0];
      }
      // Otherwise return string as fallback
      return {
        type: "string",
      };
    }

    if (def.typeName === "ZodLiteral") {
      return {
        type: typeof def.value,
        enum: [def.value],
      };
    }

    // Fallback for unknown types
    console.warn(`Unknown Zod type: ${def.typeName}, falling back to string`);
    return {
      type: "string",
    };
  } catch (error) {
    console.error("Error converting Zod schema:", error);
    // Fallback to basic schema if conversion fails
    return {
      type: "object",
      properties: {},
    };
  }
}

// Generate MCP tool definitions from the tool definitions
const baseTools = toolDefinitions.map((toolDef) => ({
  name: toolDef.name,
  description: toolDef.description,
  displayName: toolDef.displayName,
  inputSchema: convertZodToJsonSchema(toolDef.schema),
}));

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

// Pagination helper functions
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedTools {
  tools: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginatedTools(
  options: PaginationOptions = {},
): PaginatedTools {
  const { page = 1, limit = 50 } = options;
  const allTools = getFilteredTools();

  const total = allTools.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const tools = allTools.slice(startIndex, endIndex);

  return {
    tools,
    pagination: {
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

// Export all tools for backward compatibility
export const allTools = getFilteredTools();
