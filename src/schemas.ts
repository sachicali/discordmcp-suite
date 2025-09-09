import { z } from "zod";

export const DiscordLoginSchema = z.object({
  token: z.string().optional(),
});

export const SetTokenSchema = z.object({
  token: z.string(),
});

export const ValidateTokenSchema = z.object({});

export const LoginStatusSchema = z.object({});

export const LogoutSchema = z.object({});

export const SendMessageSchema = z.object({
  channelId: z.string(),
  message: z.string(),
});

export const GetForumChannelsSchema = z.object({
  guildId: z.string(),
});

export const CreateForumPostSchema = z.object({
  forumChannelId: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
});

export const GetForumPostSchema = z.object({
  threadId: z.string(),
});

export const ReplyToForumSchema = z.object({
  threadId: z.string(),
  message: z.string(),
});

export const CreateTextChannelSchema = z.object({
  guildId: z.string(),
  channelName: z.string(),
  topic: z.string().optional(),
  reason: z.string().optional(),
});

export const CreateForumChannelSchema = z.object({
  guildId: z.string(),
  channelName: z.string(),
  topic: z.string().optional(),
  categoryId: z.string().optional(),
  reason: z.string().optional(),
});

export const EditChannelSchema = z.object({
  channelId: z.string(),
  name: z.string().optional(),
  topic: z.string().optional(),
  categoryId: z.string().optional(),
  reason: z.string().optional(),
});

// Category schemas
export const CreateCategorySchema = z.object({
  guildId: z.string(),
  name: z.string(),
  position: z.number().optional(),
  reason: z.string().optional(),
});

export const EditCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string().optional(),
  position: z.number().optional(),
  reason: z.string().optional(),
});

export const DeleteCategorySchema = z.object({
  categoryId: z.string(),
  reason: z.string().optional(),
});

export const DeleteChannelSchema = z.object({
  channelId: z.string(),
  reason: z.string().optional(),
});

export const ReadMessagesSchema = z.object({
  channelId: z.string(),
  limit: z.number().min(1).max(100).optional().default(50),
});

export const GetServerInfoSchema = z.object({
  guildId: z.string(),
});

export const AddReactionSchema = z.object({
  channelId: z.string(),
  messageId: z.string(),
  emoji: z.string(),
});

export const AddMultipleReactionsSchema = z.object({
  channelId: z.string(),
  messageId: z.string(),
  emojis: z.array(z.string()),
});

export const RemoveReactionSchema = z.object({
  channelId: z.string(),
  messageId: z.string(),
  emoji: z.string(),
  userId: z.string().optional(),
});

export const DeleteForumPostSchema = z.object({
  threadId: z.string(),
  reason: z.string().optional(),
});

export const DeleteMessageSchema = z.object({
  channelId: z.string(),
  messageId: z.string(),
  reason: z.string().optional(),
});

export const CreateWebhookSchema = z.object({
  channelId: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  reason: z.string().optional(),
});

export const SendWebhookMessageSchema = z.object({
  webhookId: z.string(),
  webhookToken: z.string(),
  content: z.string(),
  username: z.string().optional(),
  avatarURL: z.string().optional(),
  threadId: z.string().optional(),
});

export const EditWebhookSchema = z.object({
  webhookId: z.string(),
  webhookToken: z.string().optional(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  channelId: z.string().optional(),
  reason: z.string().optional(),
});

export const DeleteWebhookSchema = z.object({
  webhookId: z.string(),
  webhookToken: z.string().optional(),
  reason: z.string().optional(),
});

export const ListWebhooksSchema = z.object({
  guildId: z.string(),
  channelId: z.string().optional(), // Optional: filter by specific channel
});

// User Management Schemas
export const GetUserInfoSchema = z.object({
  userId: z.string(),
});

export const GetGuildMemberSchema = z.object({
  guildId: z.string(),
  userId: z.string(),
});

export const ListGuildMembersSchema = z.object({
  guildId: z.string(),
});

export const AddRoleToMemberSchema = z.object({
  guildId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  reason: z.string().optional(),
});

export const RemoveRoleFromMemberSchema = z.object({
  guildId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  reason: z.string().optional(),
});

export const KickMemberSchema = z.object({
  guildId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
});

export const BanMemberSchema = z.object({
  guildId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
  deleteMessageDays: z.number().min(0).max(7).optional().default(0),
});

export const UnbanMemberSchema = z.object({
  guildId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
});

export const TimeoutMemberSchema = z.object({
  guildId: z.string(),
  userId: z.string(),
  durationMinutes: z.number().min(0).optional(),
  reason: z.string().optional(),
});

// Direct Message Schemas
export const SendDirectMessageSchema = z.object({
  userId: z.string(),
  message: z.string(),
});

export const GetDirectMessagesSchema = z.object({
  userId: z.string(),
  limit: z.number().min(1).max(100).optional().default(50),
});

// Voice Channel Schemas
export const CreateVoiceChannelSchema = z.object({
  guildId: z.string(),
  channelName: z.string(),
  categoryId: z.string().optional(),
  userLimit: z.number().min(0).max(99).optional().default(0),
  bitrate: z.number().min(8000).max(384000).optional().default(64000),
  reason: z.string().optional(),
});

export const DeleteVoiceChannelSchema = z.object({
  guildId: z.string(),
  channelId: z.string(),
  reason: z.string().optional(),
});

export const EditVoiceChannelSchema = z.object({
  guildId: z.string(),
  channelId: z.string(),
  name: z.string().optional(),
  userLimit: z.number().min(0).max(99).optional(),
  bitrate: z.number().min(8000).max(384000).optional(),
  categoryId: z.string().optional(),
  reason: z.string().optional(),
});

export const ListVoiceChannelsSchema = z.object({
  guildId: z.string(),
});

export const GetVoiceChannelInfoSchema = z.object({
  guildId: z.string(),
  channelId: z.string(),
});

// Server Management Schemas
export const ListServersSchema = z.object({});

// Category Management Schemas
export const CreateChannelUnderCategorySchema = z.object({
  guildId: z.string(),
  channelName: z.string(),
  channelType: z.enum(["text", "voice", "forum"]),
  categoryId: z.string(),
  topic: z.string().optional(),
  reason: z.string().optional(),
});

export const MoveChannelToCategorySchema = z.object({
  channelId: z.string(),
  categoryId: z.string(),
  reason: z.string().optional(),
});

// Role Management Schemas
export const CreateRoleSchema = z.object({
  guildId: z.string(),
  name: z.string(),
  color: z.number().optional(), // Hex color as decimal
  hoist: z.boolean().optional(), // Display separately in member list
  mentionable: z.boolean().optional(), // Can be mentioned by everyone
  permissions: z.array(z.string()).optional(), // Array of permission strings
  reason: z.string().optional(),
});

export const EditRoleSchema = z.object({
  roleId: z.string(),
  name: z.string().optional(),
  color: z.number().optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  reason: z.string().optional(),
});

export const DeleteRoleSchema = z.object({
  roleId: z.string(),
  reason: z.string().optional(),
});

export const ListRolesSchema = z.object({
  guildId: z.string(),
});

export const GetRolePermissionsSchema = z.object({
  roleId: z.string(),
});

// Server Settings Schemas
export const UpdateServerSettingsSchema = z.object({
  guildId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(), // Base64 encoded image or URL
  banner: z.string().optional(), // Base64 encoded image or URL
  splash: z.string().optional(), // Base64 encoded image or URL
  discoverySplash: z.string().optional(), // Base64 encoded image or URL
  afkChannelId: z.string().optional(),
  afkTimeout: z.number().optional(), // 60, 300, 900, 1800, 3600 seconds
  defaultMessageNotifications: z
    .enum(["ALL_MESSAGES", "ONLY_MENTIONS"])
    .optional(),
  explicitContentFilter: z
    .enum(["DISABLED", "MEMBERS_WITHOUT_ROLES", "ALL_MEMBERS"])
    .optional(),
  verificationLevel: z
    .enum(["NONE", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"])
    .optional(),
  reason: z.string().optional(),
});

// Server Engagement Schemas
export const UpdateServerEngagementSchema = z.object({
  guildId: z.string(),
  systemChannelId: z.string().optional(), // Channel for system messages
  systemChannelFlags: z.array(z.string()).optional(), // ["SUPPRESS_JOIN_NOTIFICATIONS", "SUPPRESS_PREMIUM_SUBSCRIPTIONS", "SUPPRESS_GUILD_REMINDER_NOTIFICATIONS", "SUPPRESS_JOIN_NOTIFICATION_REPLIES"]
  rulesChannelId: z.string().optional(),
  publicUpdatesChannelId: z.string().optional(),
  preferredLocale: z.string().optional(), // Language code like "en-US"
  reason: z.string().optional(),
});

// Welcome Screen Schemas
export const UpdateWelcomeScreenSchema = z.object({
  guildId: z.string(),
  enabled: z.boolean().optional(),
  welcomeChannels: z
    .array(
      z.object({
        channelId: z.string(),
        description: z.string(),
        emojiId: z.string().optional(),
        emojiName: z.string().optional(),
      }),
    )
    .optional(),
  description: z.string().optional(),
  reason: z.string().optional(),
});

// Emoji Management Schemas
export const CreateEmojiSchema = z.object({
  guildId: z.string(),
  name: z.string(),
  image: z.string(), // Base64 encoded image
  roles: z.array(z.string()).optional(), // Role IDs that can use this emoji
  reason: z.string().optional(),
});

export const DeleteEmojiSchema = z.object({
  guildId: z.string(),
  emojiId: z.string(),
  reason: z.string().optional(),
});

export const ListEmojisSchema = z.object({
  guildId: z.string(),
});

// Sticker Management Schemas
export const CreateStickerSchema = z.object({
  guildId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.string(), // Comma-separated tags
  file: z.string(), // Base64 encoded image (PNG/APNG/LOTTIE)
  reason: z.string().optional(),
});

export const DeleteStickerSchema = z.object({
  guildId: z.string(),
  stickerId: z.string(),
  reason: z.string().optional(),
});

export const ListStickersSchema = z.object({
  guildId: z.string(),
});

// Invite Management Schemas
export const CreateInviteSchema = z.object({
  channelId: z.string(),
  maxAge: z.number().optional(), // Duration in seconds (0 = never, 604800 = 7 days)
  maxUses: z.number().optional(), // Max uses (0 = unlimited)
  temporary: z.boolean().optional(), // Grant temporary membership
  unique: z.boolean().optional(), // Create unique invite
  targetUserId: z.string().optional(), // Target specific user
  targetApplicationId: z.string().optional(), // Target application
  reason: z.string().optional(),
});

export const DeleteInviteSchema = z.object({
  inviteCode: z.string(),
  reason: z.string().optional(),
});

export const ListInvitesSchema = z.object({
  guildId: z.string(),
});

// App Integration Schemas
export const ListIntegrationsSchema = z.object({
  guildId: z.string(),
});

export const DeleteIntegrationSchema = z.object({
  guildId: z.string(),
  integrationId: z.string(),
  reason: z.string().optional(),
});

// Soundboard Management Schemas
export const CreateSoundboardSoundSchema = z.object({
  guildId: z.string(),
  name: z.string(),
  sound: z.string(), // Base64 encoded audio file (MP3, OGG, WAV)
  volume: z.number().min(0).max(1).optional().default(1), // Volume multiplier
  emojiId: z.string().optional(),
  emojiName: z.string().optional(),
  reason: z.string().optional(),
});

export const DeleteSoundboardSoundSchema = z.object({
  guildId: z.string(),
  soundId: z.string(),
  reason: z.string().optional(),
});

export const ListSoundboardSoundsSchema = z.object({
  guildId: z.string(),
});
