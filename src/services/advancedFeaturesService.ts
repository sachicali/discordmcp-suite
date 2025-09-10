/**
 * @fileoverview Advanced Discord Features Service
 * @description Provides advanced Discord functionality including scheduled events,
 * auto-moderation, message analytics, and automated backup systems
 */

import { EventEmitter } from "events";
import {
  Client,
  Guild,
  GuildScheduledEvent,
  GuildScheduledEventCreateOptions,
  Message,
  ChannelType,
} from "discord.js";
import { info, error } from "../logger.js";
import fs from "fs/promises";
import path from "path";

/**
 * Auto-moderation rule types
 */
export enum AutoModerationRuleType {
  KEYWORD_FILTER = "keyword_filter",
  SPAM_DETECTION = "spam_detection",
  CAPS_LIMIT = "caps_limit",
  LINK_FILTER = "link_filter",
  MENTION_SPAM = "mention_spam",
  DUPLICATE_MESSAGE = "duplicate_message",
}

/**
 * Auto-moderation action types
 */
export enum AutoModerationAction {
  DELETE_MESSAGE = "delete_message",
  TIMEOUT_USER = "timeout_user",
  WARN_USER = "warn_user",
  LOG_INCIDENT = "log_incident",
  NOTIFY_MODERATORS = "notify_moderators",
}

/**
 * Message analytics data
 */
interface MessageAnalytics {
  totalMessages: number;
  messagesByChannel: Map<string, number>;
  messagesByUser: Map<string, number>;
  messagesByHour: Map<number, number>;
  topKeywords: Map<string, number>;
  averageMessageLength: number;
  mediaMessages: number;
}

/**
 * Auto-moderation rule
 */
interface AutoModerationRule {
  id: string;
  name: string;
  type: AutoModerationRuleType;
  enabled: boolean;
  conditions: Record<string, any>;
  actions: AutoModerationAction[];
  exemptRoles: string[];
  exemptChannels: string[];
  createdAt: number;
}

/**
 * Backup configuration
 */
interface BackupConfig {
  enabled: boolean;
  interval: number; // in hours
  backupPath: string;
  includeMessages: boolean;
  includeSettings: boolean;
  includePermissions: boolean;
  maxBackups: number;
}

/**
 * Advanced Features Service configuration
 */
interface AdvancedFeaturesConfig {
  enableScheduledEvents: boolean;
  enableAutoModeration: boolean;
  enableMessageAnalytics: boolean;
  enableBackupSystem: boolean;
  backupConfig: BackupConfig;
  analyticsRetention: number; // days
}

/**
 * Advanced Discord Features Service
 */
export class AdvancedFeaturesService extends EventEmitter {
  private config: AdvancedFeaturesConfig;
  private autoModerationRules: Map<string, AutoModerationRule> = new Map();
  private messageAnalytics: MessageAnalytics;
  private recentMessages: Map<string, Message[]> = new Map(); // For duplicate detection
  private backupInterval: NodeJS.Timeout | null = null;
  private analyticsCleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AdvancedFeaturesConfig> = {}) {
    super();

    this.config = {
      enableScheduledEvents: true,
      enableAutoModeration: true,
      enableMessageAnalytics: true,
      enableBackupSystem: false, // Disabled by default due to storage requirements
      backupConfig: {
        enabled: false,
        interval: 24, // 24 hours
        backupPath: "./backups",
        includeMessages: false, // Privacy consideration
        includeSettings: true,
        includePermissions: true,
        maxBackups: 7, // Keep 7 days
      },
      analyticsRetention: 30, // 30 days
      ...config,
    };

    this.messageAnalytics = {
      totalMessages: 0,
      messagesByChannel: new Map(),
      messagesByUser: new Map(),
      messagesByHour: new Map(),
      topKeywords: new Map(),
      averageMessageLength: 0,
      mediaMessages: 0,
    };

    this.initializeServices();
  }

  /**
   * Initialize services
   */
  private initializeServices(): void {
    if (this.config.enableBackupSystem && this.config.backupConfig.enabled) {
      this.startBackupSystem();
    }

    if (this.config.enableMessageAnalytics) {
      this.startAnalyticsCleanup();
    }

    info("Advanced Features Service initialized");
  }

  /**
   * Create scheduled event
   */
  async createScheduledEvent(
    client: Client,
    guildId: string,
    eventData: {
      name: string;
      description?: string;
      scheduledStartTime: Date;
      scheduledEndTime?: Date;
      privacyLevel: "GUILD_ONLY";
      entityType: "VOICE" | "STAGE_INSTANCE" | "EXTERNAL";
      channelId?: string;
      entityMetadata?: {
        location?: string;
      };
    },
  ): Promise<GuildScheduledEvent | null> {
    if (!this.config.enableScheduledEvents) {
      throw new Error("Scheduled events are disabled");
    }

    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        throw new Error("Guild not found");
      }

      const eventOptions: GuildScheduledEventCreateOptions = {
        name: eventData.name,
        description: eventData.description,
        scheduledStartTime: eventData.scheduledStartTime,
        scheduledEndTime: eventData.scheduledEndTime,
        privacyLevel: 2, // GUILD_ONLY
        entityType:
          eventData.entityType === "VOICE"
            ? 2
            : eventData.entityType === "STAGE_INSTANCE"
              ? 1
              : 3,
        channel: eventData.channelId
          ? (guild.channels.cache.get(eventData.channelId) as any)
          : undefined,
        entityMetadata: eventData.entityMetadata,
      };

      const scheduledEvent = await guild.scheduledEvents.create(eventOptions);

      info(
        `Scheduled event created: ${scheduledEvent.name} (${scheduledEvent.id})`,
      );
      this.emit("scheduledEventCreated", { event: scheduledEvent, guildId });

      return scheduledEvent;
    } catch (err) {
      error(`Failed to create scheduled event: ${err}`);
      return null;
    }
  }

  /**
   * Process message for auto-moderation
   */
  async processMessage(message: Message): Promise<void> {
    if (!this.config.enableAutoModeration || message.author.bot) {
      return;
    }

    // Update analytics
    if (this.config.enableMessageAnalytics) {
      this.updateMessageAnalytics(message);
    }

    // Check against auto-moderation rules
    for (const rule of this.autoModerationRules.values()) {
      if (!rule.enabled) continue;

      // Check exemptions
      if (this.isExemptFromRule(message, rule)) continue;

      // Check rule conditions
      const violation = await this.checkRuleViolation(message, rule);
      if (violation) {
        await this.executeRuleActions(message, rule, violation);
        break; // Stop after first violation
      }
    }
  }

  /**
   * Check if user/channel is exempt from rule
   */
  private isExemptFromRule(
    message: Message,
    rule: AutoModerationRule,
  ): boolean {
    // Check channel exemption
    if (rule.exemptChannels.includes(message.channelId)) {
      return true;
    }

    // Check role exemption
    if (message.member) {
      const userRoles = message.member.roles.cache.map((role) => role.id);
      if (rule.exemptRoles.some((roleId) => userRoles.includes(roleId))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if message violates rule
   */
  private async checkRuleViolation(
    message: Message,
    rule: AutoModerationRule,
  ): Promise<string | null> {
    const content = message.content.toLowerCase();

    switch (rule.type) {
      case AutoModerationRuleType.KEYWORD_FILTER:
        const keywords = rule.conditions.keywords as string[];
        for (const keyword of keywords) {
          if (content.includes(keyword.toLowerCase())) {
            return `Keyword violation: ${keyword}`;
          }
        }
        break;

      case AutoModerationRuleType.CAPS_LIMIT:
        const capsThreshold = rule.conditions.threshold as number;
        const capsPercentage = this.calculateCapsPercentage(message.content);
        if (capsPercentage > capsThreshold) {
          return `Excessive caps: ${capsPercentage.toFixed(1)}%`;
        }
        break;

      case AutoModerationRuleType.SPAM_DETECTION:
        const spamWindow = rule.conditions.timeWindowMs as number;
        const maxMessages = rule.conditions.maxMessages as number;
        if (
          this.isSpamming(
            message.author.id,
            message.channelId,
            spamWindow,
            maxMessages,
          )
        ) {
          return `Spam detection: Too many messages`;
        }
        break;

      case AutoModerationRuleType.LINK_FILTER:
        const linkPattern = /(https?:\/\/[^\s]+)/gi;
        if (linkPattern.test(content)) {
          return `Unauthorized link detected`;
        }
        break;

      case AutoModerationRuleType.MENTION_SPAM:
        const maxMentions = rule.conditions.maxMentions as number;
        const mentionCount =
          message.mentions.users.size + message.mentions.roles.size;
        if (mentionCount > maxMentions) {
          return `Excessive mentions: ${mentionCount}`;
        }
        break;

      case AutoModerationRuleType.DUPLICATE_MESSAGE:
        if (this.isDuplicateMessage(message)) {
          return `Duplicate message detected`;
        }
        break;
    }

    return null;
  }

  /**
   * Execute rule actions
   */
  private async executeRuleActions(
    message: Message,
    rule: AutoModerationRule,
    violation: string,
  ): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action) {
          case AutoModerationAction.DELETE_MESSAGE:
            if (message.deletable) {
              await message.delete();
              info(`Deleted message from ${message.author.tag}: ${violation}`);
            }
            break;

          case AutoModerationAction.TIMEOUT_USER:
            if (message.member && message.member.moderatable) {
              await message.member.timeout(10 * 60 * 1000, violation); // 10 minutes
              info(`Timed out ${message.author.tag}: ${violation}`);
            }
            break;

          case AutoModerationAction.WARN_USER:
            try {
              await message.author.send(
                `⚠️ **Warning**: Your message violated server rules: ${violation}`,
              );
              info(`Warned ${message.author.tag}: ${violation}`);
            } catch {
              // User has DMs disabled
            }
            break;

          case AutoModerationAction.LOG_INCIDENT:
            this.emit("moderationIncident", {
              userId: message.author.id,
              channelId: message.channelId,
              guildId: message.guildId,
              violation,
              rule: rule.name,
              timestamp: Date.now(),
            });
            break;

          case AutoModerationAction.NOTIFY_MODERATORS:
            // This would typically send to a mod log channel
            this.emit("notifyModerators", {
              userId: message.author.id,
              channelId: message.channelId,
              guildId: message.guildId,
              violation,
              rule: rule.name,
              messageContent: message.content.substring(0, 100),
            });
            break;
        }
      } catch (err) {
        error(`Failed to execute moderation action ${action}: ${err}`);
      }
    }
  }

  /**
   * Calculate caps percentage in message
   */
  private calculateCapsPercentage(content: string): number {
    const letters = content.replace(/[^a-zA-Z]/g, "");
    if (letters.length === 0) return 0;

    const capsLetters = content.replace(/[^A-Z]/g, "");
    return (capsLetters.length / letters.length) * 100;
  }

  /**
   * Check if user is spamming
   */
  private isSpamming(
    userId: string,
    channelId: string,
    windowMs: number,
    maxMessages: number,
  ): boolean {
    const key = `${userId}:${channelId}`;
    const messages = this.recentMessages.get(key) || [];
    const now = Date.now();

    // Filter recent messages within window
    const recentMessages = messages.filter(
      (msg) => now - msg.createdTimestamp < windowMs,
    );
    this.recentMessages.set(key, recentMessages);

    return recentMessages.length >= maxMessages;
  }

  /**
   * Check if message is duplicate
   */
  private isDuplicateMessage(message: Message): boolean {
    const key = `${message.author.id}:${message.channelId}`;
    const messages = this.recentMessages.get(key) || [];

    // Check for duplicate content in last 5 messages
    const recentContent = messages.slice(-5).map((msg) => msg.content);
    const isDuplicate =
      recentContent.includes(message.content) && message.content.length > 10;

    // Add current message to history
    messages.push(message);
    if (messages.length > 20) {
      // Keep only last 20 messages per user per channel
      messages.shift();
    }
    this.recentMessages.set(key, messages);

    return isDuplicate;
  }

  /**
   * Update message analytics
   */
  private updateMessageAnalytics(message: Message): void {
    this.messageAnalytics.totalMessages++;

    // By channel
    const channelCount =
      this.messageAnalytics.messagesByChannel.get(message.channelId) || 0;
    this.messageAnalytics.messagesByChannel.set(
      message.channelId,
      channelCount + 1,
    );

    // By user
    const userCount =
      this.messageAnalytics.messagesByUser.get(message.author.id) || 0;
    this.messageAnalytics.messagesByUser.set(message.author.id, userCount + 1);

    // By hour
    const hour = new Date().getHours();
    const hourCount = this.messageAnalytics.messagesByHour.get(hour) || 0;
    this.messageAnalytics.messagesByHour.set(hour, hourCount + 1);

    // Update average message length
    const totalChars =
      this.messageAnalytics.averageMessageLength *
        (this.messageAnalytics.totalMessages - 1) +
      message.content.length;
    this.messageAnalytics.averageMessageLength =
      totalChars / this.messageAnalytics.totalMessages;

    // Media messages
    if (message.attachments.size > 0) {
      this.messageAnalytics.mediaMessages++;
    }

    // Keywords (simple word frequency)
    const words = message.content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    for (const word of words) {
      const count = this.messageAnalytics.topKeywords.get(word) || 0;
      this.messageAnalytics.topKeywords.set(word, count + 1);
    }
  }

  /**
   * Add auto-moderation rule
   */
  addAutoModerationRule(
    rule: Omit<AutoModerationRule, "id" | "createdAt">,
  ): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const fullRule: AutoModerationRule = {
      ...rule,
      id,
      createdAt: Date.now(),
    };

    this.autoModerationRules.set(id, fullRule);
    info(`Auto-moderation rule added: ${rule.name} (${id})`);

    return id;
  }

  /**
   * Remove auto-moderation rule
   */
  removeAutoModerationRule(ruleId: string): boolean {
    const removed = this.autoModerationRules.delete(ruleId);
    if (removed) {
      info(`Auto-moderation rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Get message analytics
   */
  getMessageAnalytics(): MessageAnalytics & {
    topChannels: Array<{ id: string; count: number }>;
    topUsers: Array<{ id: string; count: number }>;
    peakHours: Array<{ hour: number; count: number }>;
    topWords: Array<{ word: string; count: number }>;
  } {
    const topChannels = Array.from(
      this.messageAnalytics.messagesByChannel.entries(),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));

    const topUsers = Array.from(this.messageAnalytics.messagesByUser.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));

    const peakHours = Array.from(this.messageAnalytics.messagesByHour.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([hour, count]) => ({ hour, count }));

    const topWords = Array.from(this.messageAnalytics.topKeywords.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    return {
      ...this.messageAnalytics,
      topChannels,
      topUsers,
      peakHours,
      topWords,
    };
  }

  /**
   * Create server backup
   */
  async createServerBackup(
    client: Client,
    guildId: string,
  ): Promise<string | null> {
    if (!this.config.enableBackupSystem) {
      throw new Error("Backup system is disabled");
    }

    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        throw new Error("Guild not found");
      }

      const backupData = await this.gatherBackupData(guild);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${guild.name}-${timestamp}.json`;
      const filepath = path.join(this.config.backupConfig.backupPath, filename);

      await fs.mkdir(this.config.backupConfig.backupPath, { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));

      // Clean up old backups
      await this.cleanupOldBackups();

      info(`Server backup created: ${filepath}`);
      this.emit("backupCreated", { guildId, filepath, filename });

      return filepath;
    } catch (err) {
      error(`Failed to create backup: ${err}`);
      return null;
    }
  }

  /**
   * Gather backup data from guild
   */
  private async gatherBackupData(guild: Guild): Promise<any> {
    const backupData: any = {
      guildId: guild.id,
      name: guild.name,
      description: guild.description,
      icon: guild.iconURL(),
      banner: guild.bannerURL(),
      createdAt: guild.createdAt,
      backupTimestamp: new Date().toISOString(),
      channels: [],
      roles: [],
      settings: {},
    };

    // Guild settings
    if (this.config.backupConfig.includeSettings) {
      backupData.settings = {
        verificationLevel: guild.verificationLevel,
        defaultMessageNotifications: guild.defaultMessageNotifications,
        explicitContentFilter: guild.explicitContentFilter,
        mfaLevel: guild.mfaLevel,
        systemChannel: guild.systemChannelId,
        rulesChannel: guild.rulesChannelId,
        publicUpdatesChannel: guild.publicUpdatesChannelId,
      };
    }

    // Channels
    for (const channel of guild.channels.cache.values()) {
      const channelData: any = {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        position: (channel as any).position,
        parentId: channel.parentId,
      };

      if (channel.type === ChannelType.GuildText) {
        const textChannel = channel as any;
        channelData.topic = textChannel.topic;
        channelData.nsfw = textChannel.nsfw;
        channelData.rateLimitPerUser = textChannel.rateLimitPerUser;
      }

      if (
        this.config.backupConfig.includePermissions &&
        (channel as any).permissionOverwrites
      ) {
        channelData.permissions = (
          channel as any
        ).permissionOverwrites.cache.map((overwrite: any) => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.toArray(),
          deny: overwrite.deny.toArray(),
        }));
      }

      backupData.channels.push(channelData);
    }

    // Roles
    if (this.config.backupConfig.includePermissions) {
      for (const role of guild.roles.cache.values()) {
        backupData.roles.push({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          hoist: role.hoist,
          mentionable: role.mentionable,
          position: role.position,
          permissions: role.permissions.toArray(),
        });
      }
    }

    return backupData;
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.backupConfig.backupPath);
      const backupFiles = files.filter(
        (file) => file.startsWith("backup-") && file.endsWith(".json"),
      );

      if (backupFiles.length <= this.config.backupConfig.maxBackups) {
        return;
      }

      // Sort by modification time and remove oldest
      const fileStats = await Promise.all(
        backupFiles.map(async (file) => {
          const filepath = path.join(this.config.backupConfig.backupPath, file);
          const stats = await fs.stat(filepath);
          return { file, mtime: stats.mtime, filepath };
        }),
      );

      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      const filesToRemove = fileStats.slice(
        0,
        fileStats.length - this.config.backupConfig.maxBackups,
      );

      for (const { filepath } of filesToRemove) {
        await fs.unlink(filepath);
        info(`Removed old backup: ${filepath}`);
      }
    } catch (err) {
      error(`Failed to cleanup old backups: ${err}`);
    }
  }

  /**
   * Start backup system
   */
  private startBackupSystem(): void {
    const intervalMs = this.config.backupConfig.interval * 60 * 60 * 1000;

    this.backupInterval = setInterval(() => {
      this.emit("scheduledBackup");
      info("Scheduled backup triggered");
    }, intervalMs);

    info(
      `Backup system started with ${this.config.backupConfig.interval}h interval`,
    );
  }

  /**
   * Start analytics cleanup
   */
  private startAnalyticsCleanup(): void {
    // Clean up analytics data daily
    this.analyticsCleanupInterval = setInterval(
      () => {
        this.cleanupAnalytics();
      },
      24 * 60 * 60 * 1000,
    );
  }

  /**
   * Clean up old analytics data
   */
  private cleanupAnalytics(): void {
    const cutoff =
      Date.now() - this.config.analyticsRetention * 24 * 60 * 60 * 1000;

    // Clean up recent messages cache
    for (const [key, messages] of this.recentMessages.entries()) {
      const filtered = messages.filter((msg) => msg.createdTimestamp > cutoff);
      if (filtered.length === 0) {
        this.recentMessages.delete(key);
      } else {
        this.recentMessages.set(key, filtered);
      }
    }

    info("Analytics data cleaned up");
  }

  /**
   * Get auto-moderation statistics
   */
  getAutoModerationStats(): {
    totalRules: number;
    enabledRules: number;
    rulesByType: Record<string, number>;
  } {
    const rules = Array.from(this.autoModerationRules.values());
    const rulesByType: Record<string, number> = {};

    for (const rule of rules) {
      rulesByType[rule.type] = (rulesByType[rule.type] || 0) + 1;
    }

    return {
      totalRules: rules.length,
      enabledRules: rules.filter((r) => r.enabled).length,
      rulesByType,
    };
  }

  /**
   * Shutdown advanced features service
   */
  shutdown(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }

    if (this.analyticsCleanupInterval) {
      clearInterval(this.analyticsCleanupInterval);
      this.analyticsCleanupInterval = null;
    }

    this.autoModerationRules.clear();
    this.recentMessages.clear();

    info("Advanced Features Service shutdown complete");
  }
}
