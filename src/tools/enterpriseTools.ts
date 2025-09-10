/**
 * @fileoverview Enterprise Discord Tools with Advanced Features
 * @description Demonstrates how to integrate enterprise services with Discord tools
 */

import { z } from "zod";
import { Client } from "discord.js";
import { ToolResponse } from "./types.js";
import { handleDiscordError } from "../errorHandler.js";
import { EnterpriseIntegrationService } from "../services/enterpriseIntegrationService.js";
import {
  AutoModerationRuleType,
  AutoModerationAction,
} from "../services/advancedFeaturesService.js";

/**
 * Enhanced tool context with enterprise services
 */
interface EnterpriseToolContext {
  client: Client;
  enterpriseService?: EnterpriseIntegrationService;
}

// Enhanced server health check with enterprise monitoring
export const serverHealthCheckSchema = z.object({
  detailed: z
    .boolean()
    .optional()
    .describe("Include detailed service health information"),
});

export async function serverHealthCheckHandler(
  args: z.infer<typeof serverHealthCheckSchema>,
  context: EnterpriseToolContext,
): Promise<ToolResponse> {
  try {
    if (!context.enterpriseService) {
      // Basic health check without enterprise features
      return {
        content: [
          {
            type: "text",
            text: `🏥 **Basic Health Check**

**Discord Client**: ${context.client.isReady() ? "✅ Connected" : "❌ Disconnected"}
**Guilds**: ${context.client.guilds.cache.size} servers
**Uptime**: ${Math.floor(context.client.uptime || 0 / 1000)}s

*Note: Enterprise monitoring not available. Enable enterprise services for comprehensive health monitoring.*`,
          },
        ],
        isError: false,
      };
    }

    // Perform comprehensive health check with enterprise services
    const systemStatus = context.enterpriseService.getSystemStatus();
    const analytics = context.enterpriseService.getAnalytics();

    let healthReport = `🏥 **Enterprise Health Check**

**Overall Status**: ${getStatusEmoji(systemStatus.overall)} ${systemStatus.overall.toUpperCase()}

**Service Summary**:
- Total Services: ${systemStatus.summary.totalServices}
- Healthy: ${systemStatus.summary.healthyServices} ✅
- Warning: ${systemStatus.summary.warningServices} ⚠️
- Critical: ${systemStatus.summary.criticalServices} ❌

**Discord Connection**:
- Status: ${context.client.isReady() ? "✅ Connected" : "❌ Disconnected"}
- Guilds: ${context.client.guilds.cache.size}
- Ping: ${context.client.ws.ping}ms
- Uptime: ${formatUptime(context.client.uptime || 0)}`;

    if (args.detailed) {
      healthReport += `\n\n**Detailed Service Status**:`;

      for (const [serviceName, health] of Object.entries(
        systemStatus.services,
      )) {
        healthReport += `\n- **${serviceName}**: ${getStatusEmoji(health.status)} ${health.status}`;
        if (health.errors && health.errors.length > 0) {
          healthReport += ` (${health.errors[0]})`;
        }
      }

      if (analytics.performance) {
        healthReport += `\n\n**Performance Metrics**:`;
        healthReport += `\n- Memory Usage: ${analytics.performance.memory?.heapUsedMB || "N/A"}MB`;
        healthReport += `\n- Tool Usage: ${Object.keys(analytics.performance.toolUsage || {}).length} tools used`;

        if (analytics.performance.averageResponseTimes) {
          const avgTimes = Object.entries(
            analytics.performance.averageResponseTimes,
          );
          if (avgTimes.length > 0) {
            const [slowestOp, slowestTime] = avgTimes.reduce((a, b) =>
              (a[1] as number) > (b[1] as number) ? a : b,
            );
            healthReport += `\n- Slowest Operation: ${slowestOp} (${Math.round(slowestTime as number)}ms)`;
          }
        }
      }

      if (analytics.security) {
        healthReport += `\n\n**Security Summary**:`;
        healthReport += `\n- Total Audit Logs: ${analytics.security.totalAuditLogs || 0}`;
        healthReport += `\n- Recent Events (24h): ${analytics.security.last24Hours?.total || 0}`;

        if (analytics.security.last24Hours?.bySeverity) {
          const criticalEvents =
            analytics.security.last24Hours.bySeverity.critical || 0;
          if (criticalEvents > 0) {
            healthReport += `\n- ⚠️ Critical Security Events: ${criticalEvents}`;
          }
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: healthReport,
        },
      ],
      isError: systemStatus.overall === "critical",
    };
  } catch (err) {
    return await handleDiscordError(
      err,
      context.client.user?.id,
      {
        toolName: "server_health_check",
      },
      context.enterpriseService,
    );
  }
}

// Enterprise analytics tool
export const getAnalyticsSchema = z.object({
  category: z
    .enum(["performance", "security", "usage", "errors", "moderation"])
    .optional()
    .describe("Specific analytics category to retrieve"),
  timeRange: z
    .enum(["1h", "24h", "7d", "30d"])
    .optional()
    .default("24h")
    .describe("Time range for analytics data"),
});

export async function getAnalyticsHandler(
  args: z.infer<typeof getAnalyticsSchema>,
  context: EnterpriseToolContext,
): Promise<ToolResponse> {
  try {
    if (!context.enterpriseService) {
      return {
        content: [
          {
            type: "text",
            text: `📊 **Analytics Not Available**

Enterprise analytics require the enterprise integration service to be enabled.

**Available without enterprise**:
- Basic Discord client statistics
- Guild count: ${context.client.guilds.cache.size}
- User count: ${context.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}

To enable full analytics, initialize the EnterpriseIntegrationService.`,
          },
        ],
        isError: false,
      };
    }

    const analytics = context.enterpriseService.getAnalytics();

    if (args.category) {
      // Return specific category
      const categoryData = analytics[args.category];
      if (!categoryData) {
        return {
          content: [
            {
              type: "text",
              text: `❌ No data available for category: ${args.category}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `📊 **${args.category.toUpperCase()} Analytics** (${args.timeRange})

${JSON.stringify(categoryData, null, 2)}`,
          },
        ],
        isError: false,
      };
    }

    // Return comprehensive analytics
    let analyticsReport = `📊 **Comprehensive Analytics** (${args.timeRange})\n\n`;

    // Performance Analytics
    if (analytics.performance) {
      analyticsReport += `**📈 Performance**:\n`;
      analyticsReport += `- Uptime: ${formatUptime(analytics.performance.uptime || 0)}\n`;
      analyticsReport += `- Memory Usage: ${analytics.performance.memory?.heapUsedMB || "N/A"}MB\n`;

      const toolUsage = analytics.performance.toolUsage;
      if (toolUsage && Object.keys(toolUsage).length > 0) {
        const topTools = Object.entries(toolUsage)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5);
        analyticsReport += `- Top Tools: ${topTools.map(([tool, count]) => `${tool} (${count})`).join(", ")}\n`;
      }
    }

    // Security Analytics
    if (analytics.security) {
      analyticsReport += `\n**🔒 Security**:\n`;
      analyticsReport += `- Total Audit Events: ${analytics.security.totalAuditLogs || 0}\n`;
      analyticsReport += `- Recent Events: ${analytics.security.last24Hours?.total || 0}\n`;

      if (analytics.security.last24Hours?.byEventType) {
        const eventTypes = Object.entries(
          analytics.security.last24Hours.byEventType,
        )
          .filter(([, count]) => (count as number) > 0)
          .slice(0, 3);
        if (eventTypes.length > 0) {
          analyticsReport += `- Top Event Types: ${eventTypes.map(([type, count]) => `${type} (${count})`).join(", ")}\n`;
        }
      }
    }

    // Usage Analytics
    if (analytics.usage) {
      analyticsReport += `\n**📱 Usage**:\n`;
      analyticsReport += `- Total Messages: ${analytics.usage.totalMessages || 0}\n`;
      analyticsReport += `- Media Messages: ${analytics.usage.mediaMessages || 0}\n`;
      analyticsReport += `- Average Message Length: ${Math.round(analytics.usage.averageMessageLength || 0)} chars\n`;

      if (
        analytics.usage.topChannels &&
        analytics.usage.topChannels.length > 0
      ) {
        const topChannel = analytics.usage.topChannels[0];
        analyticsReport += `- Most Active Channel: <#${topChannel.id}> (${topChannel.count} messages)\n`;
      }
    }

    // Error Analytics
    if (analytics.errors) {
      analyticsReport += `\n**❌ Errors**:\n`;
      analyticsReport += `- Total Errors: ${analytics.errors.totalErrors || 0}\n`;
      analyticsReport += `- Recent Errors: ${analytics.errors.recentErrors || 0}\n`;
      analyticsReport += `- Retryable: ${analytics.errors.retryableErrors || 0}\n`;
      analyticsReport += `- Non-retryable: ${analytics.errors.nonRetryableErrors || 0}\n`;
    }

    // Moderation Analytics
    if (analytics.moderation) {
      analyticsReport += `\n**🛡️ Auto-Moderation**:\n`;
      analyticsReport += `- Total Rules: ${analytics.moderation.totalRules || 0}\n`;
      analyticsReport += `- Enabled Rules: ${analytics.moderation.enabledRules || 0}\n`;

      if (analytics.moderation.rulesByType) {
        const ruleTypes = Object.entries(
          analytics.moderation.rulesByType,
        ).filter(([, count]) => (count as number) > 0);
        if (ruleTypes.length > 0) {
          analyticsReport += `- Rule Types: ${ruleTypes.map(([type, count]) => `${type} (${count})`).join(", ")}\n`;
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: analyticsReport,
        },
      ],
      isError: false,
    };
  } catch (err) {
    return await handleDiscordError(
      err,
      context.client.user?.id,
      {
        toolName: "get_analytics",
        parameters: args,
      },
      context.enterpriseService,
    );
  }
}

// Auto-moderation rule management
export const addAutoModerationRuleSchema = z.object({
  name: z.string().describe("Name for the auto-moderation rule"),
  type: z
    .enum([
      "keyword_filter",
      "spam_detection",
      "caps_limit",
      "link_filter",
      "mention_spam",
      "duplicate_message",
    ])
    .describe("Type of auto-moderation rule"),
  conditions: z.record(z.any()).describe("Rule conditions (varies by type)"),
  actions: z
    .array(
      z.enum([
        "delete_message",
        "timeout_user",
        "warn_user",
        "log_incident",
        "notify_moderators",
      ]),
    )
    .describe("Actions to take when rule is violated"),
  exemptRoles: z
    .array(z.string())
    .optional()
    .describe("Role IDs exempt from this rule"),
  exemptChannels: z
    .array(z.string())
    .optional()
    .describe("Channel IDs exempt from this rule"),
});

export async function addAutoModerationRuleHandler(
  args: z.infer<typeof addAutoModerationRuleSchema>,
  context: EnterpriseToolContext,
): Promise<ToolResponse> {
  try {
    if (!context.enterpriseService) {
      return {
        content: [
          {
            type: "text",
            text: `🛡️ **Auto-Moderation Not Available**

Auto-moderation requires the enterprise integration service to be enabled.

**To enable auto-moderation**:
1. Initialize EnterpriseIntegrationService with advancedFeatures enabled
2. Configure auto-moderation rules through the service
3. The system will automatically process messages for violations

**Rule Type Requested**: ${args.type}
**Actions**: ${args.actions.join(", ")}`,
          },
        ],
        isError: false,
      };
    }

    // Map string types to enum values
    const ruleType = args.type as AutoModerationRuleType;
    const actions = args.actions as AutoModerationAction[];

    const ruleId = context.enterpriseService.addAutoModerationRule({
      name: args.name,
      type: ruleType,
      conditions: args.conditions,
      actions: actions,
      exemptRoles: args.exemptRoles,
      exemptChannels: args.exemptChannels,
    });

    if (!ruleId) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to create auto-moderation rule: Advanced features service not available`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ **Auto-Moderation Rule Created**

**Rule ID**: ${ruleId}
**Name**: ${args.name}
**Type**: ${args.type}
**Actions**: ${args.actions.join(", ")}

**Conditions**:
${JSON.stringify(args.conditions, null, 2)}

**Exemptions**:
- Roles: ${args.exemptRoles?.length || 0} roles exempt
- Channels: ${args.exemptChannels?.length || 0} channels exempt

The rule is now active and will automatically monitor messages for violations.`,
        },
      ],
      isError: false,
    };
  } catch (err) {
    return await handleDiscordError(
      err,
      context.client.user?.id,
      {
        toolName: "add_auto_moderation_rule",
        parameters: args,
      },
      context.enterpriseService,
    );
  }
}

// Rate limiter status
export const getRateLimiterStatusSchema = z.object({});

export async function getRateLimiterStatusHandler(
  _args: z.infer<typeof getRateLimiterStatusSchema>,
  context: EnterpriseToolContext,
): Promise<ToolResponse> {
  try {
    if (!context.enterpriseService) {
      return {
        content: [
          {
            type: "text",
            text: `⏱️ **Rate Limiter Not Available**

Enterprise rate limiting is not enabled. Current setup uses basic Discord.js rate limiting.

**To enable enterprise rate limiting**:
- Initialize EnterpriseIntegrationService with rate limiting enabled
- Configure custom rate limits and queue management
- Get detailed metrics and monitoring`,
          },
        ],
        isError: false,
      };
    }

    // Access rate limiter through enterprise service
    const rateLimiter = (context.enterpriseService as any).services
      ?.rateLimiter;

    if (!rateLimiter) {
      return {
        content: [
          {
            type: "text",
            text: `⏱️ **Rate Limiter Service Disabled**

The rate limiter service is not currently active in the enterprise configuration.`,
          },
        ],
        isError: false,
      };
    }

    const metrics = rateLimiter.getMetrics();

    return {
      content: [
        {
          type: "text",
          text: `⏱️ **Rate Limiter Status**

**Queue Status**:
- Current Queue Size: ${metrics.queueSize}
- Active Requests: ${metrics.activeRequests}
- Total Requests: ${metrics.totalRequests}

**Performance**:
- Rate Limit Hits: ${metrics.rateLimitHits}
- Retry Attempts: ${metrics.retryAttempts}
- Average Wait Time: ${Math.round(metrics.averageWaitTime)}ms

**Memory Usage**:
- Memory Usage: ${Math.round(metrics.memoryUsage)}MB
- Active Buckets: ${metrics.buckets}

**Health**: ${metrics.queueSize > 500 ? "⚠️ High Queue" : "✅ Normal"}`,
        },
      ],
      isError: false,
    };
  } catch (err) {
    return await handleDiscordError(
      err,
      context.client.user?.id,
      {
        toolName: "get_rate_limiter_status",
      },
      context.enterpriseService,
    );
  }
}

// Utility functions
function getStatusEmoji(status: string): string {
  switch (status) {
    case "healthy":
      return "✅";
    case "warning":
      return "⚠️";
    case "critical":
      return "❌";
    case "offline":
      return "⚫";
    default:
      return "❓";
  }
}

function formatUptime(uptime: number): string {
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
