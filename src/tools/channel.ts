import { z } from "zod";
import { ChannelType } from "discord.js";
import { ToolContext, ToolResponse } from "./types.js";
import {
  CreateTextChannelSchema,
  CreateForumChannelSchema,
  EditChannelSchema,
  DeleteChannelSchema,
  ReadMessagesSchema,
  GetServerInfoSchema,
  CreateCategorySchema,
  EditCategorySchema,
  DeleteCategorySchema,
  ListServersSchema,
  CreateChannelUnderCategorySchema,
  MoveChannelToCategorySchema,
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
} from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";

// Category creation handler
export async function createCategoryHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, name, position, reason } = CreateCategorySchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Cannot find guild with ID: ${guildId}` },
        ],
        isError: true,
      };
    }
    const options: any = { name, type: ChannelType.GuildCategory };
    if (typeof position === "number") options.position = position;
    if (reason) options.reason = reason;
    const category = await guild.channels.create(options);
    return {
      content: [
        {
          type: "text",
          text: `Successfully created category "${name}" with ID: ${category.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Category edit handler
export async function editCategoryHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { categoryId, name, position, reason } = EditCategorySchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }
    const category = await context.client.channels.fetch(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return {
        content: [
          { type: "text", text: `Cannot find category with ID: ${categoryId}` },
        ],
        isError: true,
      };
    }
    const update: any = {};
    if (name) update.name = name;
    if (typeof position === "number") update.position = position;
    if (reason) update.reason = reason;
    await category.edit(update);
    return {
      content: [
        {
          type: "text",
          text: `Successfully edited category with ID: ${categoryId}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Category deletion handler
export async function deleteCategoryHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { categoryId, reason } = DeleteCategorySchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }
    const category = await context.client.channels.fetch(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return {
        content: [
          { type: "text", text: `Cannot find category with ID: ${categoryId}` },
        ],
        isError: true,
      };
    }
    await category.delete(reason || "Category deleted via API");
    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted category with ID: ${categoryId}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Text channel creation handler
export async function createTextChannelHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, channelName, topic, reason } =
    CreateTextChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Cannot find guild with ID: ${guildId}` },
        ],
        isError: true,
      };
    }

    // Create the text channel
    const channelOptions: any = {
      name: channelName,
      type: ChannelType.GuildText,
    };
    if (topic) channelOptions.topic = topic;
    if (reason) channelOptions.reason = reason;
    const channel = await guild.channels.create(channelOptions);

    return {
      content: [
        {
          type: "text",
          text: `Successfully created text channel "${channelName}" with ID: ${channel.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Forum channel creation handler
export async function createForumChannelHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, channelName, topic, categoryId, reason } =
    CreateForumChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Cannot find guild with ID: ${guildId}` },
        ],
        isError: true,
      };
    }

    // Create the forum channel
    const channelOptions: any = {
      name: channelName,
      type: ChannelType.GuildForum,
    };
    if (topic) channelOptions.topic = topic;
    if (categoryId) channelOptions.parent = categoryId;
    if (reason) channelOptions.reason = reason;

    const channel = await guild.channels.create(channelOptions);

    return {
      content: [
        {
          type: "text",
          text: `Successfully created forum channel "${channelName}" with ID: ${channel.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Channel edit handler
export async function editChannelHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { channelId, name, topic, categoryId, reason } =
    EditChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel) {
      return {
        content: [
          { type: "text", text: `Cannot find channel with ID: ${channelId}` },
        ],
        isError: true,
      };
    }

    // Check if channel supports editing
    if (!("edit" in channel)) {
      return {
        content: [
          { type: "text", text: `This channel type does not support editing` },
        ],
        isError: true,
      };
    }

    const update: any = {};
    if (name) update.name = name;
    if (topic && "topic" in channel) update.topic = topic;
    if (categoryId) update.parent = categoryId;
    if (reason) update.reason = reason;

    await channel.edit(update);

    return {
      content: [
        {
          type: "text",
          text: `Successfully edited channel with ID: ${channelId}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Channel deletion handler
export async function deleteChannelHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { channelId, reason } = DeleteChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel) {
      return {
        content: [
          { type: "text", text: `Cannot find channel with ID: ${channelId}` },
        ],
        isError: true,
      };
    }

    // Check if channel can be deleted (has delete method)
    if (!("delete" in channel)) {
      return {
        content: [
          {
            type: "text",
            text: `This channel type does not support deletion or the bot lacks permissions`,
          },
        ],
        isError: true,
      };
    }

    // Delete the channel
    await channel.delete(reason || "Channel deleted via API");

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted channel with ID: ${channelId}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Message reading handler
export async function readMessagesHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { channelId, limit } = ReadMessagesSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel) {
      return {
        content: [
          { type: "text", text: `Cannot find channel with ID: ${channelId}` },
        ],
        isError: true,
      };
    }

    // Check if channel has messages (text channel, thread, etc.)
    if (!channel.isTextBased() || !("messages" in channel)) {
      return {
        content: [
          {
            type: "text",
            text: `Channel type does not support reading messages`,
          },
        ],
        isError: true,
      };
    }

    // Fetch messages
    const messages = await channel.messages.fetch({ limit });

    if (messages.size === 0) {
      return {
        content: [{ type: "text", text: `No messages found in channel` }],
      };
    }

    // Format messages
    const formattedMessages = messages
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        author: {
          id: msg.author.id,
          username: msg.author.username,
          bot: msg.author.bot,
        },
        timestamp: msg.createdAt,
        attachments: msg.attachments.size,
        embeds: msg.embeds.length,
        replyTo: msg.reference ? msg.reference.messageId : null,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              channelId,
              messageCount: formattedMessages.length,
              messages: formattedMessages,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Server information handler
export async function getServerInfoHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId } = GetServerInfoSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Cannot find guild with ID: ${guildId}` },
        ],
        isError: true,
      };
    }

    // Fetch additional server data
    await guild.fetch();

    // Fetch channel information
    const channels = await guild.channels.fetch();

    // Categorize channels by type
    const channelsByType = {
      text: channels.filter((c) => c?.type === ChannelType.GuildText).size,
      voice: channels.filter((c) => c?.type === ChannelType.GuildVoice).size,
      category: channels.filter((c) => c?.type === ChannelType.GuildCategory)
        .size,
      forum: channels.filter((c) => c?.type === ChannelType.GuildForum).size,
      announcement: channels.filter(
        (c) => c?.type === ChannelType.GuildAnnouncement,
      ).size,
      stage: channels.filter((c) => c?.type === ChannelType.GuildStageVoice)
        .size,
      total: channels.size,
    };

    // Get detailed information for all channels
    const channelDetails = channels
      .map((channel) => {
        if (!channel) return null;

        return {
          id: channel.id,
          name: channel.name,
          type: ChannelType[channel.type] || channel.type,
          categoryId: channel.parentId,
          position: channel.position,
          // Only add topic for text channels
          topic: "topic" in channel ? channel.topic : null,
        };
      })
      .filter((c) => c !== null); // Filter out null values

    // Group channels by type
    const groupedChannels = {
      text: channelDetails.filter(
        (c) =>
          c.type === ChannelType[ChannelType.GuildText] ||
          c.type === ChannelType.GuildText,
      ),
      voice: channelDetails.filter(
        (c) =>
          c.type === ChannelType[ChannelType.GuildVoice] ||
          c.type === ChannelType.GuildVoice,
      ),
      category: channelDetails.filter(
        (c) =>
          c.type === ChannelType[ChannelType.GuildCategory] ||
          c.type === ChannelType.GuildCategory,
      ),
      forum: channelDetails.filter(
        (c) =>
          c.type === ChannelType[ChannelType.GuildForum] ||
          c.type === ChannelType.GuildForum,
      ),
      announcement: channelDetails.filter(
        (c) =>
          c.type === ChannelType[ChannelType.GuildAnnouncement] ||
          c.type === ChannelType.GuildAnnouncement,
      ),
      stage: channelDetails.filter(
        (c) =>
          c.type === ChannelType[ChannelType.GuildStageVoice] ||
          c.type === ChannelType.GuildStageVoice,
      ),
      all: channelDetails,
    };

    // Get member count
    const approximateMemberCount = guild.approximateMemberCount || "unknown";

    // Format guild information
    const guildInfo = {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      icon: guild.iconURL(),
      owner: guild.ownerId,
      createdAt: guild.createdAt,
      memberCount: approximateMemberCount,
      channels: {
        count: channelsByType,
        details: groupedChannels,
      },
      features: guild.features,
      premium: {
        tier: guild.premiumTier,
        subscriptions: guild.premiumSubscriptionCount,
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(guildInfo, null, 2) }],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List servers handler
export async function listServersHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const {} = ListServersSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guilds = context.client.guilds.cache;

    if (guilds.size === 0) {
      return {
        content: [
          { type: "text", text: "Bot is not a member of any servers." },
        ],
      };
    }

    // Format server information
    const servers = guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount || "unknown",
      ownerId: guild.ownerId,
      createdAt: guild.createdAt.toISOString(),
      features: guild.features,
      icon: guild.iconURL() || null,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              serverCount: servers.length,
              servers: servers,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Create channel under category handler
export async function createChannelUnderCategoryHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, channelName, channelType, categoryId, topic, reason } =
    CreateChannelUnderCategorySchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const category = await guild.channels.fetch(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return {
        content: [
          { type: "text", text: `Category with ID ${categoryId} not found.` },
        ],
        isError: true,
      };
    }

    let channel;
    switch (channelType) {
      case "text":
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          topic: topic,
          parent: categoryId,
          reason: reason,
        });
        break;
      case "voice":
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: categoryId,
          reason: reason,
        });
        break;
      case "forum":
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildForum,
          topic: topic,
          parent: categoryId,
          reason: reason,
        });
        break;
      default:
        return {
          content: [
            { type: "text", text: `Unsupported channel type: ${channelType}` },
          ],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: "text",
          text: `Successfully created ${channelType} channel "${channelName}" under category "${category.name}" with ID: ${channel.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Move channel to category handler
export async function moveChannelToCategoryHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { channelId, categoryId, reason } =
    MoveChannelToCategorySchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel) {
      return {
        content: [
          { type: "text", text: `Channel with ID ${channelId} not found.` },
        ],
        isError: true,
      };
    }

    // Check if it's a guild channel (not DM)
    if (channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM) {
      return {
        content: [
          { type: "text", text: "Cannot move DM or group DM channels." },
        ],
        isError: true,
      };
    }

    // Cast to GuildChannel to access guild property
    const guildChannel = channel as any; // GuildChannel
    const category = await guildChannel.guild.channels.fetch(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return {
        content: [
          { type: "text", text: `Category with ID ${categoryId} not found.` },
        ],
        isError: true,
      };
    }

    // Move the channel to the new category
    await guildChannel.setParent(categoryId, { reason });

    return {
      content: [
        {
          type: "text",
          text: `Successfully moved channel "${guildChannel.name}" to category "${category.name}"`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Update server settings handler
export async function updateServerSettingsHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const {
    guildId,
    name,
    description,
    icon,
    banner,
    splash,
    discoverySplash,
    afkChannelId,
    afkTimeout,
    defaultMessageNotifications,
    explicitContentFilter,
    verificationLevel,
    reason,
  } = UpdateServerSettingsSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    await guild.edit({
      name,
      description,
      icon,
      banner,
      splash,
      discoverySplash,
      afkChannel: afkChannelId,
      afkTimeout,
      defaultMessageNotifications: defaultMessageNotifications as any,
      explicitContentFilter: explicitContentFilter as any,
      verificationLevel: verificationLevel as any,
      reason,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully updated server settings for "${guild.name}"`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Update server engagement handler
export async function updateServerEngagementHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const {
    guildId,
    systemChannelId,
    systemChannelFlags,
    rulesChannelId,
    publicUpdatesChannelId,
    preferredLocale,
    reason,
  } = UpdateServerEngagementSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    // Convert system channel flags to bitfield
    let systemChannelFlagsBitfield = 0;
    if (systemChannelFlags && systemChannelFlags.length > 0) {
      const flagMap: { [key: string]: number } = {
        SUPPRESS_JOIN_NOTIFICATIONS: 1,
        SUPPRESS_PREMIUM_SUBSCRIPTIONS: 2,
        SUPPRESS_GUILD_REMINDER_NOTIFICATIONS: 4,
        SUPPRESS_JOIN_NOTIFICATION_REPLIES: 8,
      };

      for (const flag of systemChannelFlags) {
        const upperFlag = flag.toUpperCase();
        if (flagMap[upperFlag]) {
          systemChannelFlagsBitfield |= flagMap[upperFlag];
        }
      }
    }

    await guild.edit({
      systemChannel: systemChannelId,
      systemChannelFlags: systemChannelFlagsBitfield,
      rulesChannel: rulesChannelId,
      publicUpdatesChannel: publicUpdatesChannelId,
      preferredLocale: preferredLocale as any,
      reason,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully updated server engagement settings for "${guild.name}"`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Update welcome screen handler
export async function updateWelcomeScreenHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, enabled, welcomeChannels, description, reason } =
    UpdateWelcomeScreenSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    // Use REST API for welcome screen since Discord.js doesn't support it
    const welcomeScreenData = {
      enabled: enabled ?? true,
      welcome_channels:
        welcomeChannels?.map((channel) => ({
          channel_id: channel.channelId,
          description: channel.description,
          emoji_id: channel.emojiId,
          emoji_name: channel.emojiName,
        })) || [],
      description: description || "",
    };

    // Make REST API call
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/welcome-screen`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(welcomeScreenData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        content: [
          {
            type: "text",
            text: `Failed to update welcome screen: ${errorData.message}`,
          },
        ],
        isError: true,
      };
    }

    const result = await response.json();
    return {
      content: [
        {
          type: "text",
          text: `Successfully updated welcome screen for "${guild.name}"`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Create emoji handler
export async function createEmojiHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, name, image, roles, reason } = CreateEmojiSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const emoji = await guild.emojis.create({
      attachment: image,
      name,
      roles,
      reason,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully created emoji "${emoji.name}" with ID: ${emoji.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Delete emoji handler
export async function deleteEmojiHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, emojiId, reason } = DeleteEmojiSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const emoji = guild.emojis.cache.get(emojiId);
    if (!emoji) {
      return {
        content: [
          { type: "text", text: `Emoji with ID ${emojiId} not found.` },
        ],
        isError: true,
      };
    }

    await emoji.delete(reason);

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted emoji "${emoji.name}"`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List emojis handler
export async function listEmojisHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId } = ListEmojisSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const emojis = guild.emojis.cache.map((emoji) => ({
      id: emoji.id,
      name: emoji.name,
      animated: emoji.animated,
      available: emoji.available,
      managed: emoji.managed,
      requiresColons: emoji.requiresColons,
      roles: emoji.roles.cache.map((role) => role.name),
      createdAt: emoji.createdAt.toISOString(),
      url: emoji.url,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              guildName: guild.name,
              emojiCount: emojis.length,
              emojis: emojis,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Create sticker handler
export async function createStickerHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, name, description, tags, file, reason } =
    CreateStickerSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const sticker = await guild.stickers.create({
      file: Buffer.from(file, "base64"),
      name,
      description,
      tags,
      reason,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully created sticker "${sticker.name}" with ID: ${sticker.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Delete sticker handler
export async function deleteStickerHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, stickerId, reason } = DeleteStickerSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const sticker = guild.stickers.cache.get(stickerId);
    if (!sticker) {
      return {
        content: [
          { type: "text", text: `Sticker with ID ${stickerId} not found.` },
        ],
        isError: true,
      };
    }

    await sticker.delete(reason);

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted sticker "${sticker.name}"`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List stickers handler
export async function listStickersHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId } = ListStickersSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const stickers = guild.stickers.cache.map((sticker) => ({
      id: sticker.id,
      name: sticker.name,
      description: sticker.description,
      tags: sticker.tags,
      type: sticker.type,
      format: sticker.format,
      available: sticker.available,
      createdAt: sticker.createdAt.toISOString(),
      url: sticker.url,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              guildName: guild.name,
              stickerCount: stickers.length,
              stickers: stickers,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Create invite handler
export async function createInviteHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const {
    channelId,
    maxAge,
    maxUses,
    temporary,
    unique,
    targetUserId,
    targetApplicationId,
    reason,
  } = CreateInviteSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const channel = context.client.channels.cache.get(channelId);
    if (!channel) {
      return {
        content: [
          { type: "text", text: `Channel with ID ${channelId} not found.` },
        ],
        isError: true,
      };
    }

    // Check if it's a guild channel
    if (channel.type === 1 || channel.type === 3) {
      return {
        content: [
          { type: "text", text: "Cannot create invites for DM channels." },
        ],
        isError: true,
      };
    }

    const invite = await (channel as any).createInvite({
      maxAge,
      maxUses,
      temporary,
      unique,
      targetUser: targetUserId,
      targetApplication: targetApplicationId,
      reason,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully created invite: ${invite.url}\nCode: ${invite.code}\nExpires: ${invite.expiresAt?.toISOString() || "Never"}\nMax Uses: ${invite.maxUses || "Unlimited"}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Delete invite handler
export async function deleteInviteHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { inviteCode, reason } = DeleteInviteSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const invite = await context.client.fetchInvite(inviteCode);
    await invite.delete(reason);

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted invite: ${invite.code}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List invites handler
export async function listInvitesHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId } = ListInvitesSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    const invites = await guild.invites.fetch();
    const inviteList = invites.map((invite) => ({
      code: invite.code,
      url: invite.url,
      channel: invite.channel?.name || "Unknown",
      inviter: invite.inviter?.username || "Unknown",
      uses: invite.uses,
      maxUses: invite.maxUses,
      maxAge: invite.maxAge,
      temporary: invite.temporary,
      createdAt: invite.createdAt?.toISOString() || null,
      expiresAt: invite.expiresAt?.toISOString() || null,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              guildName: guild.name,
              inviteCount: inviteList.length,
              invites: inviteList,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List integrations handler
export async function listIntegrationsHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId } = ListIntegrationsSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    // Note: Integration fetching is not directly supported in Discord.js yet
    return {
      content: [
        {
          type: "text",
          text: "Integration listing is not yet fully supported by Discord.js. This feature will be available when Discord.js adds integration support.",
        },
      ],
      isError: true,
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Delete integration handler
export async function deleteIntegrationHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, integrationId, reason } =
    DeleteIntegrationSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    // Note: Integration deletion is not directly supported in Discord.js yet
    return {
      content: [
        {
          type: "text",
          text: "Integration deletion is not yet fully supported by Discord.js. This feature will be available when Discord.js adds integration support.",
        },
      ],
      isError: true,
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Create soundboard sound handler
export async function createSoundboardSoundHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, name, sound, volume, emojiId, emojiName, reason } =
    CreateSoundboardSoundSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    // Note: Discord.js doesn't have soundboard support yet, so this is a placeholder
    return {
      content: [
        {
          type: "text",
          text: "Soundboard functionality is not yet supported by Discord.js. This feature will be available when Discord.js adds soundboard support.",
        },
      ],
      isError: true,
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Delete soundboard sound handler
export async function deleteSoundboardSoundHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, soundId, reason } = DeleteSoundboardSoundSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    // Note: Discord.js doesn't have soundboard support yet, so this is a placeholder
    return {
      content: [
        {
          type: "text",
          text: "Soundboard functionality is not yet supported by Discord.js. This feature will be available when Discord.js adds soundboard support.",
        },
      ],
      isError: true,
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List soundboard sounds handler
export async function listSoundboardSoundsHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId } = ListSoundboardSoundsSchema.parse(args);

  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const guild = context.client.guilds.cache.get(guildId);
    if (!guild) {
      return {
        content: [
          { type: "text", text: `Guild with ID ${guildId} not found.` },
        ],
        isError: true,
      };
    }

    // Note: Discord.js doesn't have soundboard support yet, so this is a placeholder
    return {
      content: [
        {
          type: "text",
          text: "Soundboard functionality is not yet supported by Discord.js. This feature will be available when Discord.js adds soundboard support.",
        },
      ],
      isError: true,
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}
