// Enhanced Discord API error handler with enterprise features integration
import { ToolResponse } from "./tools/types.js";
import { EnterpriseIntegrationService } from "./services/enterpriseIntegrationService.js";
import { SecurityEventType } from "./services/securityService.js";

/**
 * Enhanced error handler with enterprise integration
 * @param error - The error object from Discord API calls
 * @param clientId - Optional Discord Client ID for custom invite links
 * @param context - Additional context for error tracking
 * @param enterpriseService - Enterprise integration service instance
 * @returns A standard tool response with error message and potential solution
 */
export async function handleDiscordError(
  error: any,
  clientId?: string,
  context?: {
    userId?: string;
    guildId?: string;
    channelId?: string;
    toolName?: string;
    parameters?: Record<string, any>;
  },
  enterpriseService?: EnterpriseIntegrationService,
): Promise<ToolResponse> {
  // Ensure error is in the expected format for checking
  const errorMessage =
    typeof error === "string" ? error : error?.message || String(error);
  const errorCode = error?.code;

  // Generate invite link based on client ID if provided
  const inviteLink = clientId
    ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`
    : "https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=52076489808";

  // Log to enterprise services if available
  if (enterpriseService && context) {
    try {
      // Log to security service
      const securityService = (enterpriseService as any).services?.security;
      if (securityService) {
        const severity = getSeverityFromError(errorCode, errorMessage);
        await securityService.logSecurityEvent(
          SecurityEventType.SECURITY_VIOLATION,
          {
            error: errorMessage,
            errorCode,
            toolName: context.toolName,
            parameters: context.parameters
              ? Object.keys(context.parameters)
              : undefined,
            context,
          },
          severity,
          context.userId,
          context.guildId,
        );
      }

      // Log to monitoring service
      const monitoringService = (enterpriseService as any).services?.monitoring;
      if (monitoringService && context.toolName) {
        monitoringService.recordToolUsage(
          context.toolName,
          context.userId,
          context.guildId,
          false,
        );
      }
    } catch (serviceError) {
      // Don't let service errors affect the main error handling
      console.error("Enterprise service error logging failed:", serviceError);
    }
  }

  // Check for privileged intents errors
  if (
    errorMessage.includes(
      "Privileged intent provided is not enabled or whitelisted",
    )
  ) {
    return {
      content: [
        {
          type: "text",
          text: `🚨 **Critical Configuration Error**

**Issue**: Privileged intents are not enabled for your Discord bot.

**Solution**: Enable the required intents in the Discord Developer Portal:
1. Go to https://discord.com/developers/applications
2. Select your bot application
3. Navigate to the "Bot" section
4. Enable the following Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent
   - Presence Intent

**Why this is needed**: These intents are required for the bot to access message content and server member information.

For detailed instructions, check the Prerequisites section in our README.

**Error Code**: PRIVILEGED_INTENT_ERROR`,
        },
      ],
      isError: true,
    };
  }

  // Check for unauthorized/bot not in server errors
  if (
    errorCode === 50001 || // Missing Access
    errorCode === 10004 || // Unknown Guild
    errorMessage.includes("Missing Access") ||
    errorMessage.includes("Unknown Guild") ||
    errorMessage.includes("Missing Permissions")
  ) {
    return {
      content: [
        {
          type: "text",
          text: `🔒 **Access Denied**

**Issue**: The bot is not a member of the target Discord server or lacks required permissions.

**Solutions**:
1. **Add bot to server**: Use this invite link to add the bot:
   ${inviteLink}

2. **Check permissions**: Ensure the bot has the necessary permissions for this action.

3. **Verify server ID**: Double-check that the server/guild ID is correct.

**Security Note**: According to Discord's security model, bots can only access servers they've been explicitly invited to.

**Error Code**: ${errorCode || "ACCESS_DENIED"}
**Context**: ${context?.toolName ? `Tool: ${context.toolName}` : "General access"}`,
        },
      ],
      isError: true,
    };
  }

  // Check for rate limiting
  if (errorCode === 429 || errorMessage.includes("rate limit")) {
    const retryAfter = error?.retryAfter
      ? ` Retry after ${error.retryAfter}ms.`
      : "";

    return {
      content: [
        {
          type: "text",
          text: `⏱️ **Rate Limit Reached**

**Issue**: Discord API rate limit has been exceeded.

**Solutions**:
1. **Wait and retry**: Discord rate limits are temporary.${retryAfter}
2. **Space out requests**: Consider reducing the frequency of API calls.
3. **Enterprise features**: This server includes automatic rate limiting and retry mechanisms.

**Technical Details**:
- Error Code: 429 (Too Many Requests)
- Service: Discord API
- Automatic retry: ${enterpriseService ? "Enabled" : "Not available"}

The system will automatically handle retries with exponential backoff if enterprise features are enabled.`,
        },
      ],
      isError: true,
    };
  }

  // Check for specific Discord errors with enhanced messaging
  if (errorCode === 10008) {
    return {
      content: [
        {
          type: "text",
          text: `❓ **Message Not Found**

**Issue**: The specified message could not be found.

**Possible Causes**:
- Message was deleted
- Incorrect message ID
- Bot doesn't have access to the channel
- Message is in a different server

**Solutions**:
- Verify the message ID is correct
- Check that the bot has access to the channel
- Ensure you're looking in the correct server

**Error Code**: 10008 (Unknown Message)`,
        },
      ],
      isError: true,
    };
  }

  if (errorCode === 10003) {
    return {
      content: [
        {
          type: "text",
          text: `📡 **Channel Not Found**

**Issue**: The specified channel could not be found.

**Possible Causes**:
- Channel was deleted
- Incorrect channel ID
- Bot doesn't have access to the channel
- Channel is in a different server

**Solutions**:
- Verify the channel ID is correct
- Check that the bot has view permissions for the channel
- Ensure you're looking in the correct server

**Error Code**: 10003 (Unknown Channel)`,
        },
      ],
      isError: true,
    };
  }

  if (errorCode === 50013) {
    return {
      content: [
        {
          type: "text",
          text: `🛡️ **Missing Permissions**

**Issue**: The bot lacks the necessary permissions to perform this action.

**Solutions**:
1. **Check bot role**: Ensure the bot's role has sufficient permissions
2. **Channel permissions**: Check channel-specific permission overrides
3. **Role hierarchy**: Bot's role must be higher than the target role (for role management)

**Required Permission**: This action requires specific Discord permissions that the bot currently doesn't have.

**Error Code**: 50013 (Missing Permissions)
**Context**: ${context?.toolName ? `Action: ${context.toolName}` : "Permission check"}`,
        },
      ],
      isError: true,
    };
  }

  // Enhanced general error response with enterprise context
  const enterpriseInfo = enterpriseService
    ? "\n\n🏢 **Enterprise Features**: This error has been logged for analysis and monitoring."
    : "";
  const contextInfo = context?.toolName
    ? `\n**Tool**: ${context.toolName}`
    : "";
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    content: [
      {
        type: "text",
        text: `❌ **Discord API Error**

**Message**: ${errorMessage}
**Error Code**: ${errorCode || "Unknown"}
**Error ID**: ${errorId}${contextInfo}

**Next Steps**:
1. Check the Discord server status: https://discordstatus.com/
2. Verify bot permissions and server membership
3. Review the error details above for specific guidance

If this error persists, please report it with the Error ID provided.${enterpriseInfo}`,
      },
    ],
    isError: true,
  };
}

/**
 * Determine error severity for enterprise logging
 */
function getSeverityFromError(
  errorCode: number | undefined,
  errorMessage: string,
): "low" | "medium" | "high" | "critical" {
  if (errorMessage.includes("Privileged intent")) return "critical";
  if (errorCode === 50001 || errorCode === 50013) return "high"; // Missing permissions
  if (errorCode === 429) return "medium"; // Rate limit
  if (errorCode === 10004 || errorCode === 10008) return "medium"; // Not found errors
  return "low";
}

/**
 * Legacy function for backward compatibility (synchronous)
 */
export function handleDiscordErrorLegacy(
  error: any,
  clientId?: string,
): ToolResponse {
  // For backward compatibility, provide basic error handling without enterprise features
  const errorMessage =
    typeof error === "string" ? error : error?.message || String(error);
  const errorCode = error?.code;

  const inviteLink = clientId
    ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`
    : "https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=52076489808";

  if (
    errorMessage.includes(
      "Privileged intent provided is not enabled or whitelisted",
    )
  ) {
    return {
      content: [
        {
          type: "text",
          text: `Error: Privileged intents are not enabled.\n\nSolution: Please enable the required intents in the Discord Developer Portal.`,
        },
      ],
      isError: true,
    };
  }

  if (
    errorCode === 50001 ||
    errorCode === 10004 ||
    errorMessage.includes("Missing Access") ||
    errorMessage.includes("Unknown Guild")
  ) {
    return {
      content: [
        {
          type: "text",
          text: `Error: Bot not in server or missing permissions.\n\nSolution: Add bot using: ${inviteLink}`,
        },
      ],
      isError: true,
    };
  }

  if (errorCode === 429 || errorMessage.includes("rate limit")) {
    return {
      content: [
        {
          type: "text",
          text: `Error: Discord API rate limit reached.\n\nSolution: Please wait before trying again.`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Discord API Error: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}
