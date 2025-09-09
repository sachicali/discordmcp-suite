import { z } from "zod";
import { ToolContext, ToolResponse } from "./types.js";
import {
  CreateWebhookSchema,
  SendWebhookMessageSchema,
  EditWebhookSchema,
  DeleteWebhookSchema,
  ListWebhooksSchema,
} from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";

// Create webhook handler
export async function createWebhookHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { channelId, name, avatar, reason } = CreateWebhookSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      return {
        content: [
          {
            type: "text",
            text: `Cannot find text channel with ID: ${channelId}`,
          },
        ],
        isError: true,
      };
    }

    // Check if the channel supports webhooks
    if (!("createWebhook" in channel)) {
      return {
        content: [
          {
            type: "text",
            text: `Channel type does not support webhooks: ${channelId}`,
          },
        ],
        isError: true,
      };
    }

    // Create the webhook
    const webhook = await channel.createWebhook({
      name: name,
      avatar: avatar,
      reason: reason,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully created webhook with ID: ${webhook.id} and token: ${webhook.token}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Send webhook message handler
export async function sendWebhookMessageHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { webhookId, webhookToken, content, username, avatarURL, threadId } =
    SendWebhookMessageSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const webhook = await context.client.fetchWebhook(webhookId, webhookToken);
    if (!webhook) {
      return {
        content: [
          { type: "text", text: `Cannot find webhook with ID: ${webhookId}` },
        ],
        isError: true,
      };
    }

    // Send the message
    await webhook.send({
      content: content,
      username: username,
      avatarURL: avatarURL,
      threadId: threadId,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully sent webhook message to webhook ID: ${webhookId}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Edit webhook handler
export async function editWebhookHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { webhookId, webhookToken, name, avatar, channelId, reason } =
    EditWebhookSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const webhook = await context.client.fetchWebhook(webhookId, webhookToken);
    if (!webhook) {
      return {
        content: [
          { type: "text", text: `Cannot find webhook with ID: ${webhookId}` },
        ],
        isError: true,
      };
    }

    // Edit the webhook
    await webhook.edit({
      name: name,
      avatar: avatar,
      channel: channelId,
      reason: reason,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully edited webhook with ID: ${webhook.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Delete webhook handler
export async function deleteWebhookHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { webhookId, webhookToken, reason } = DeleteWebhookSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true,
      };
    }

    const webhook = await context.client.fetchWebhook(webhookId, webhookToken);
    if (!webhook) {
      return {
        content: [
          { type: "text", text: `Cannot find webhook with ID: ${webhookId}` },
        ],
        isError: true,
      };
    }

    // Delete the webhook
    await webhook.delete(reason || "Webhook deleted via API");

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted webhook with ID: ${webhook.id}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List webhooks handler
export async function listWebhooksHandler(
  args: unknown,
  context: ToolContext,
): Promise<ToolResponse> {
  const { guildId, channelId } = ListWebhooksSchema.parse(args);
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

    let webhooks;

    if (channelId) {
      // List webhooks for a specific channel
      const channel = await context.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        return {
          content: [
            {
              type: "text",
              text: `Cannot find text channel with ID: ${channelId}`,
            },
          ],
          isError: true,
        };
      }

      if (!("fetchWebhooks" in channel)) {
        return {
          content: [
            {
              type: "text",
              text: `Channel type does not support webhooks: ${channelId}`,
            },
          ],
          isError: true,
        };
      }

      webhooks = await channel.fetchWebhooks();
    } else {
      // List all webhooks for the guild
      webhooks = await guild.fetchWebhooks();
    }

    const webhookList = webhooks.map((webhook) => ({
      id: webhook.id,
      name: webhook.name,
      channelId: webhook.channelId,
      channelName: webhook.channel?.name || "Unknown Channel",
      avatar: webhook.avatar,
      token: webhook.token ? "[REDACTED]" : null,
      applicationId: webhook.applicationId,
      user: webhook.owner
        ? {
            id: webhook.owner.id,
            username: webhook.owner.username,
            discriminator: webhook.owner.discriminator,
          }
        : null,
      createdAt: webhook.createdAt?.toISOString(),
      url: webhook.url,
    }));

    return {
      content: [
        {
          type: "text",
          text: `Found ${webhookList.length} webhook(s)${channelId ? ` in channel ${channelId}` : ` in guild ${guildId}`}:\n\n${webhookList
            .map(
              (webhook, index) =>
                `${index + 1}. **${webhook.name}** (ID: ${webhook.id})\n` +
                `   - Channel: ${webhook.channelName} (${webhook.channelId})\n` +
                `   - Created: ${webhook.createdAt || "Unknown"}\n` +
                `   - Owner: ${webhook.user ? `${webhook.user.username}#${webhook.user.discriminator}` : "Unknown"}\n` +
                `   - URL: ${webhook.url}\n`,
            )
            .join("\n")}`,
        },
      ],
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}
