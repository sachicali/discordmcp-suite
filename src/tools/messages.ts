import { ToolHandler } from "./types.js";
import { handleDiscordError } from "../errorHandler.js";
import { error } from "../logger.js";

// Pin message
export const pinMessageHandler: ToolHandler = async (args, context) => {
  try {
    const channel = context.client.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Channel not found" }],
        isError: true,
      };
    }

    if (!channel.isTextBased()) {
      return {
        content: [{ type: "text", text: "Channel is not a text channel" }],
        isError: true,
      };
    }

    const message = await channel.messages.fetch(args.messageId);
    if (!message) {
      return {
        content: [{ type: "text", text: "Message not found" }],
        isError: true,
      };
    }

    await message.pin(args.reason || "Message pinned via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully pinned message: "${message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}"`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error pinning message: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Unpin message
export const unpinMessageHandler: ToolHandler = async (args, context) => {
  try {
    const channel = context.client.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Channel not found" }],
        isError: true,
      };
    }

    if (!channel.isTextBased()) {
      return {
        content: [{ type: "text", text: "Channel is not a text channel" }],
        isError: true,
      };
    }

    const message = await channel.messages.fetch(args.messageId);
    if (!message) {
      return {
        content: [{ type: "text", text: "Message not found" }],
        isError: true,
      };
    }

    await message.unpin(args.reason || "Message unpinned via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully unpinned message: "${message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}"`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error unpinning message: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Edit message sent by bot
export const editBotMessageHandler: ToolHandler = async (args, context) => {
  try {
    const channel = context.client.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Channel not found" }],
        isError: true,
      };
    }

    if (!channel.isTextBased()) {
      return {
        content: [{ type: "text", text: "Channel is not a text channel" }],
        isError: true,
      };
    }

    const message = await channel.messages.fetch(args.messageId);
    if (!message) {
      return {
        content: [{ type: "text", text: "Message not found" }],
        isError: true,
      };
    }

    if (message.author.id !== context.client.user?.id) {
      return {
        content: [
          { type: "text", text: "Can only edit messages sent by this bot" },
        ],
        isError: true,
      };
    }

    await message.edit(args.newContent);

    return {
      content: [
        {
          type: "text",
          text: `Successfully edited message to: "${args.newContent.substring(0, 100)}${args.newContent.length > 100 ? "..." : ""}"`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error editing bot message: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Bulk delete messages
export const bulkDeleteMessagesHandler: ToolHandler = async (args, context) => {
  try {
    const channel = context.client.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Channel not found" }],
        isError: true,
      };
    }

    if (!channel.isTextBased()) {
      return {
        content: [{ type: "text", text: "Channel is not a text channel" }],
        isError: true,
      };
    }

    let messages = await channel.messages.fetch({
      limit: Math.min(args.amount, 100),
    });

    // Apply filters
    if (args.authorId) {
      messages = messages.filter((msg) => msg.author.id === args.authorId);
    }

    if (args.olderThanDays) {
      const cutoff = new Date(
        Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000,
      );
      messages = messages.filter((msg) => msg.createdAt < cutoff);
    }

    if (args.contentContains) {
      const searchTerm = args.contentContains.toLowerCase();
      messages = messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchTerm),
      );
    }

    if (messages.size === 0) {
      return {
        content: [
          { type: "text", text: "No messages found matching the criteria" },
        ],
        isError: false,
      };
    }

    // Discord bulk delete has limitations - messages must be less than 14 days old
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentMessages = messages.filter(
      (msg) => msg.createdAt > twoWeeksAgo,
    );
    const oldMessages = messages.filter((msg) => msg.createdAt <= twoWeeksAgo);

    let deletedCount = 0;

    // Bulk delete recent messages (more efficient)
    if (recentMessages.size > 0 && "bulkDelete" in channel) {
      if (recentMessages.size === 1) {
        await recentMessages.first()?.delete();
        deletedCount += 1;
      } else {
        const deleted = await channel.bulkDelete(recentMessages, true);
        deletedCount += deleted.size;
      }
    } else if (recentMessages.size > 0) {
      // Fallback for channels that don't support bulk delete
      for (const message of recentMessages.values()) {
        try {
          await message.delete();
          deletedCount += 1;
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err) {
          continue;
        }
      }
    }

    // Individual delete for old messages
    for (const message of oldMessages.values()) {
      try {
        await message.delete();
        deletedCount += 1;
        // Add small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        // Skip messages that can't be deleted
        continue;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted ${deletedCount} messages from ${channel.type === 1 ? "DM Channel" : channel.name || "Unknown Channel"}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error bulk deleting messages: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Search messages
export const searchMessagesHandler: ToolHandler = async (args, context) => {
  try {
    const channel = context.client.channels.cache.get(args.channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: "Channel not found" }],
        isError: true,
      };
    }

    if (!channel.isTextBased()) {
      return {
        content: [{ type: "text", text: "Channel is not a text channel" }],
        isError: true,
      };
    }

    const limit = Math.min(args.limit || 50, 100);
    let messages = await channel.messages.fetch({ limit });

    // Apply search filters
    const searchTerm = args.query.toLowerCase();
    let filteredMessages = messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchTerm),
    );

    if (args.authorId) {
      filteredMessages = filteredMessages.filter(
        (msg) => msg.author.id === args.authorId,
      );
    }

    if (args.beforeDate) {
      const beforeDate = new Date(args.beforeDate);
      filteredMessages = filteredMessages.filter(
        (msg) => msg.createdAt < beforeDate,
      );
    }

    if (args.afterDate) {
      const afterDate = new Date(args.afterDate);
      filteredMessages = filteredMessages.filter(
        (msg) => msg.createdAt > afterDate,
      );
    }

    if (filteredMessages.size === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No messages found matching query: "${args.query}"`,
          },
        ],
      };
    }

    const results = filteredMessages
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
      .first(10) // Limit to first 10 results
      .map((msg) => {
        const preview =
          msg.content.length > 100
            ? msg.content.substring(0, 100) + "..."
            : msg.content;

        return `[${msg.createdAt.toISOString()}] ${msg.author.username}: ${preview}`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${filteredMessages.size} messages matching "${args.query}":\n\n${results}${filteredMessages.size > 10 ? `\n\n... and ${filteredMessages.size - 10} more results` : ""}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error searching messages: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};
