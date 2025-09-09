import { ToolHandler } from "./types.js";
import { handleDiscordError } from "../errorHandler.js";
import { info, error } from "../logger.js";

// Send direct message to a user
export const sendDirectMessageHandler: ToolHandler = async (args, context) => {
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const user = await context.client.users.fetch(args.userId);
    const dmChannel = await user.createDM();

    await dmChannel.send(args.message);

    return {
      content: [
        {
          type: "text",
          text: `Direct message successfully sent to ${user.username}#${user.discriminator}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error sending direct message: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Get direct message history with a user
export const getDirectMessagesHandler: ToolHandler = async (args, context) => {
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const user = await context.client.users.fetch(args.userId);
    const dmChannel = await user.createDM();

    const messages = await dmChannel.messages.fetch({
      limit: args.limit || 50,
    });

    const messageList = messages
      .map((msg) => {
        const timestamp = msg.createdAt.toISOString();
        const author = msg.author.username;
        const content = msg.content || "[No text content]";
        return `[${timestamp}] ${author}: ${content}`;
      })
      .reverse()
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Direct Messages with ${user.username}#${user.discriminator}:\n${messageList}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error getting direct messages: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};
