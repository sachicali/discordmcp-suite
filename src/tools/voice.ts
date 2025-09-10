import { ToolHandler } from "./types.js";
import { handleDiscordError } from "../errorHandler.js";
import { error } from "../logger.js";

// Create voice channel
export const createVoiceChannelHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const channel = await guild.channels.create({
      name: args.channelName,
      type: 2, // GUILD_VOICE
      parent: args.categoryId || null,
      userLimit: args.userLimit || 0,
      bitrate: args.bitrate || 64000,
      reason: args.reason || "Voice channel created via MCP",
    });

    return {
      content: [
        {
          type: "text",
          text: `Voice channel "${channel.name}" created successfully with ID: ${channel.id}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error creating voice channel: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Delete voice channel
export const deleteVoiceChannelHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const channel = guild.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Voice channel not found" }],
        isError: true,
      };
    }

    if (channel.type !== 2) {
      // Not a voice channel
      return {
        content: [{ type: "text", text: "Channel is not a voice channel" }],
        isError: true,
      };
    }

    await channel.delete(args.reason || "Voice channel deleted via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Voice channel "${channel.name}" deleted successfully`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error deleting voice channel: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Edit voice channel
export const editVoiceChannelHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const channel = guild.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Voice channel not found" }],
        isError: true,
      };
    }

    if (channel.type !== 2) {
      // Not a voice channel
      return {
        content: [{ type: "text", text: "Channel is not a voice channel" }],
        isError: true,
      };
    }

    const updates: any = {};
    if (args.name) updates.name = args.name;
    if (args.userLimit !== undefined) updates.userLimit = args.userLimit;
    if (args.bitrate !== undefined) updates.bitrate = args.bitrate;
    if (args.categoryId !== undefined) updates.parent = args.categoryId;

    await channel.edit(updates);

    return {
      content: [
        {
          type: "text",
          text: `Voice channel "${channel.name}" updated successfully`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error editing voice channel: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// List voice channels
export const listVoiceChannelsHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const voiceChannels = guild.channels.cache.filter(
      (channel) => channel.type === 2,
    );
    const channelList = voiceChannels
      .map((channel) => {
        const voiceChannel = channel as any; // Type assertion for voice channel properties
        return `${channel.name} (${channel.id}) - Users: ${voiceChannel.members?.size || 0}/${voiceChannel.userLimit || "∞"} - Bitrate: ${voiceChannel.bitrate}bps`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Voice Channels in ${guild.name}:\n${channelList || "No voice channels found"}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error listing voice channels: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Get voice channel info
export const getVoiceChannelInfoHandler: ToolHandler = async (
  args,
  context,
) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const channel = guild.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Voice channel not found" }],
        isError: true,
      };
    }

    if (channel.type !== 2) {
      // Not a voice channel
      return {
        content: [{ type: "text", text: "Channel is not a voice channel" }],
        isError: true,
      };
    }

    const voiceChannel = channel as any; // Type assertion for voice channel properties
    const members =
      voiceChannel.members
        ?.map(
          (member: any) =>
            `${member.user.username}#${member.user.discriminator}`,
        )
        .join(", ") || "None";

    return {
      content: [
        {
          type: "text",
          text: `Voice Channel Info:
- Name: ${channel.name}
- ID: ${channel.id}
- User Limit: ${voiceChannel.userLimit || "No limit"}
- Bitrate: ${voiceChannel.bitrate}bps
- Position: ${channel.position}
- Category: ${channel.parent?.name || "None"}
- Connected Users: ${members}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error getting voice channel info: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Move user between voice channels
export const moveUserToVoiceChannelHandler: ToolHandler = async (
  args,
  context,
) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = guild.members.cache.get(args.userId);
    if (!member) {
      return {
        content: [{ type: "text", text: "Member not found in guild" }],
        isError: true,
      };
    }

    const targetChannel = guild.channels.cache.get(args.targetChannelId);
    if (!targetChannel) {
      return {
        content: [{ type: "text", text: "Target voice channel not found" }],
        isError: true,
      };
    }

    if (targetChannel.type !== 2) {
      return {
        content: [
          { type: "text", text: "Target channel is not a voice channel" },
        ],
        isError: true,
      };
    }

    if (!member.voice.channel) {
      return {
        content: [
          { type: "text", text: "User is not connected to a voice channel" },
        ],
        isError: true,
      };
    }

    await member.voice.setChannel(
      targetChannel,
      args.reason || "User moved via MCP",
    );

    return {
      content: [
        {
          type: "text",
          text: `Successfully moved ${member.user.username} to ${targetChannel.name}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error moving user to voice channel: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Mute user in voice channel
export const muteUserInVoiceHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = guild.members.cache.get(args.userId);
    if (!member) {
      return {
        content: [{ type: "text", text: "Member not found in guild" }],
        isError: true,
      };
    }

    if (!member.voice.channel) {
      return {
        content: [
          { type: "text", text: "User is not connected to a voice channel" },
        ],
        isError: true,
      };
    }

    await member.voice.setMute(
      args.muted,
      args.reason || "Voice mute toggled via MCP",
    );

    return {
      content: [
        {
          type: "text",
          text: `Successfully ${args.muted ? "muted" : "unmuted"} ${member.user.username} in voice channel`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error muting user in voice channel: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Deafen user in voice channel
export const deafenUserInVoiceHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = guild.members.cache.get(args.userId);
    if (!member) {
      return {
        content: [{ type: "text", text: "Member not found in guild" }],
        isError: true,
      };
    }

    if (!member.voice.channel) {
      return {
        content: [
          { type: "text", text: "User is not connected to a voice channel" },
        ],
        isError: true,
      };
    }

    await member.voice.setDeaf(
      args.deafened,
      args.reason || "Voice deafen toggled via MCP",
    );

    return {
      content: [
        {
          type: "text",
          text: `Successfully ${args.deafened ? "deafened" : "undeafened"} ${member.user.username} in voice channel`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error deafening user in voice channel: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};
