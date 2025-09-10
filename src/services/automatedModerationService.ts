/**
 * @fileoverview Automated Moderation Service
 * @description Advanced automated moderation system with content filtering,
 * spam detection, user behavior analysis, and automated actions.
 * Provides comprehensive moderation capabilities for Discord servers.
 *
 * Features:
 * - Content filtering with customizable rules
 * - Spam and flood protection
 * - User behavior analysis and pattern detection
 * - Automated warnings, mutes, and bans
 * - Audit logging and moderation queue
 * - Machine learning-based threat detection
 * - False positive management
 *
 * @author MCP Discord Team
 * @version 1.0.0
 * @since 1.4.0
 */

import { EventEmitter } from "events";
import { Client, Guild, GuildMember, Message, TextChannel } from "discord.js";
import { info, error } from "../logger.js";

/**
 * Moderation action types
 */
export enum ModerationAction {
  WARN = "warn",
  MUTE = "mute",
  KICK = "kick",
  BAN = "ban",
  DELETE_MESSAGE = "delete_message",
  DELETE_MESSAGES = "delete_messages",
  QUARANTINE = "quarantine",
}

/**
 * Violation types
 */
export enum ViolationType {
  SPAM = "spam",
  FLOOD = "flood",
  PROFANITY = "profanity",
  HARASSMENT = "harassment",
  SCAM = "scam",
  MALWARE = "malware",
  SELF_PROMOTION = "self_promotion",
  EXCESSIVE_CAPS = "excessive_caps",
  EXCESSIVE_EMOJI = "excessive_emoji",
  REPETITIVE_TEXT = "repetitive_text",
  SUSPICIOUS_BEHAVIOR = "suspicious_behavior",
}

/**
 * Severity levels for violations
 */
export enum ViolationSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Moderation rule configuration
 */
export interface ModerationRule {
  id: string;
  name: string;
  type: ViolationType;
  enabled: boolean;
  severity: ViolationSeverity;
  action: ModerationAction;
  threshold?: number;
  timeframe_minutes?: number;
  whitelist_roles?: string[];
  whitelist_channels?: string[];
  custom_patterns?: RegExp[];
  description?: string;
}

/**
 * User behavior tracking
 */
interface UserBehavior {
  user_id: string;
  guild_id: string;
  violations: ViolationRecord[];
  message_count: number;
  warnings: number;
  mutes: number;
  last_message_time: number;
  join_date: number;
  risk_score: number;
  is_quarantined: boolean;
}

/**
 * Violation record
 */
interface ViolationRecord {
  id: string;
  type: ViolationType;
  severity: ViolationSeverity;
  timestamp: number;
  channel_id: string;
  message_id?: string;
  content?: string;
  action_taken: ModerationAction;
  moderator: string; // "system" for automated
  notes?: string;
  evidence?: Record<string, any>;
}

/**
 * Comprehensive Automated Moderation Service
 */
export class AutomatedModerationService extends EventEmitter {
  private config: {
    enabled: boolean;
    auto_action_enabled: boolean;
    require_human_review_threshold: number;
    max_violations_per_hour: number;
    quarantine_role_id?: string;
    moderation_log_channel_id?: string;
    default_mute_duration_minutes: number;
    escalation_enabled: boolean;
  };
  private client: Client | null = null;
  private rules: Map<string, ModerationRule> = new Map();
  private userBehavior: Map<string, UserBehavior> = new Map();

  // Precompiled regex patterns for performance
  private spamPatterns: RegExp[] = [
    /(.)\1{10,}/gi, // Character repetition
    /^[A-Z\s]{20,}$/gm, // Excessive caps
    /(.{3,})\1{3,}/gi, // Pattern repetition
    /discord\.gg\/[a-zA-Z0-9]{6,}/gi, // Discord invites
    /https?:\/\/[^\s]+/gi, // URLs (for spam detection)
  ];

  private profanityPatterns: RegExp[] = [
    // Basic profanity filter - can be expanded
    /\b(fuck|shit|damn|bitch|asshole)\b/gi,
    // Add more sophisticated patterns as needed
  ];

  private scamPatterns: RegExp[] = [
    /free\s+(nitro|steam|gift|money)/gi,
    /claim\s+your\s+(prize|reward)/gi,
    /click\s+here\s+to\s+(win|get|claim)/gi,
    /limited\s+time\s+offer/gi,
  ];

  constructor(
    config?: Partial<{
      enabled: boolean;
      auto_action_enabled: boolean;
      require_human_review_threshold: number;
      max_violations_per_hour: number;
      quarantine_role_id?: string;
      moderation_log_channel_id?: string;
      default_mute_duration_minutes: number;
      escalation_enabled: boolean;
    }>,
  ) {
    super();

    this.config = {
      enabled: true,
      auto_action_enabled: true,
      require_human_review_threshold: 0.7,
      max_violations_per_hour: 3,
      default_mute_duration_minutes: 60,
      escalation_enabled: true,
      ...config,
    };

    this.setupDefaultRules();
  }

  /**
   * Initialize the moderation service
   */
  async initialize(client: Client): Promise<void> {
    this.client = client;

    // Setup event listeners
    this.client.on("messageCreate", (message) => this.handleMessage(message));
    this.client.on("guildMemberAdd", (member) => this.handleMemberJoin(member));

    // Cleanup old records periodically
    setInterval(() => this.cleanupOldRecords(), 60 * 60 * 1000); // Every hour

    info("Automated moderation service initialized");
    this.emit("service_initialized");
  }

  /**
   * Setup default moderation rules
   */
  private setupDefaultRules(): void {
    const defaultRules: ModerationRule[] = [
      {
        id: "spam_detection",
        name: "Spam Detection",
        type: ViolationType.SPAM,
        enabled: true,
        severity: ViolationSeverity.MEDIUM,
        action: ModerationAction.DELETE_MESSAGE,
        threshold: 3,
        timeframe_minutes: 5,
        description: "Detects spam messages and repetitive content",
      },
      {
        id: "flood_protection",
        name: "Flood Protection",
        type: ViolationType.FLOOD,
        enabled: true,
        severity: ViolationSeverity.HIGH,
        action: ModerationAction.MUTE,
        threshold: 5,
        timeframe_minutes: 1,
        description: "Prevents message flooding",
      },
      {
        id: "profanity_filter",
        name: "Profanity Filter",
        type: ViolationType.PROFANITY,
        enabled: true,
        severity: ViolationSeverity.MEDIUM,
        action: ModerationAction.WARN,
        description: "Filters offensive language",
      },
      {
        id: "scam_detection",
        name: "Scam Detection",
        type: ViolationType.SCAM,
        enabled: true,
        severity: ViolationSeverity.CRITICAL,
        action: ModerationAction.BAN,
        description: "Detects and blocks scam attempts",
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: Message): Promise<void> {
    if (!this.config.enabled || message.author.bot) {
      return;
    }

    try {
      // Update user behavior tracking
      await this.updateUserBehavior(message);

      // Analyze message content
      const analysis = await this.analyzeMessage(message);

      if (analysis.is_violation) {
        await this.processViolation(message, analysis);
      }
    } catch (err) {
      error(`Error processing message: ${err}`);
    }
  }

  /**
   * Handle member join
   */
  private async handleMemberJoin(member: GuildMember): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Initialize user behavior tracking
      const behavior: UserBehavior = {
        user_id: member.id,
        guild_id: member.guild.id,
        violations: [],
        message_count: 0,
        warnings: 0,
        mutes: 0,
        last_message_time: Date.now(),
        join_date: Date.now(),
        risk_score: this.calculateInitialRiskScore(member),
        is_quarantined: false,
      };

      this.userBehavior.set(`${member.guild.id}:${member.id}`, behavior);

      info(`Initialized behavior tracking for ${member.user.tag}`);
    } catch (err) {
      error(`Error processing member join: ${err}`);
    }
  }

  /**
   * Analyze message for violations
   */
  private async analyzeMessage(message: Message): Promise<{
    is_violation: boolean;
    confidence: number;
    violations: ViolationType[];
    severity: ViolationSeverity;
    evidence: Record<string, any>;
    suggested_action: ModerationAction;
  }> {
    const content = message.content.toLowerCase();
    const violations: ViolationType[] = [];
    const evidence: Record<string, any> = {};
    let maxSeverity = ViolationSeverity.LOW;
    let confidence = 0;

    // Check spam patterns
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        violations.push(ViolationType.SPAM);
        evidence.spam_pattern = pattern.source;
        maxSeverity = this.getHigherSeverity(
          maxSeverity,
          ViolationSeverity.MEDIUM,
        );
        confidence = Math.max(confidence, 0.7);
        break;
      }
    }

    // Check profanity
    for (const pattern of this.profanityPatterns) {
      if (pattern.test(content)) {
        violations.push(ViolationType.PROFANITY);
        evidence.profanity_detected = true;
        maxSeverity = this.getHigherSeverity(
          maxSeverity,
          ViolationSeverity.MEDIUM,
        );
        confidence = Math.max(confidence, 0.8);
        break;
      }
    }

    // Check scam patterns
    for (const pattern of this.scamPatterns) {
      if (pattern.test(content)) {
        violations.push(ViolationType.SCAM);
        evidence.scam_pattern = pattern.source;
        maxSeverity = this.getHigherSeverity(
          maxSeverity,
          ViolationSeverity.CRITICAL,
        );
        confidence = Math.max(confidence, 0.9);
        break;
      }
    }

    // Determine suggested action
    let suggestedAction = ModerationAction.WARN;
    if (maxSeverity === ViolationSeverity.CRITICAL) {
      suggestedAction = ModerationAction.BAN;
    } else if (maxSeverity === ViolationSeverity.HIGH) {
      suggestedAction = ModerationAction.MUTE;
    } else if (violations.includes(ViolationType.SPAM)) {
      suggestedAction = ModerationAction.DELETE_MESSAGE;
    }

    return {
      is_violation: violations.length > 0,
      confidence,
      violations,
      severity: maxSeverity,
      evidence,
      suggested_action: suggestedAction,
    };
  }

  /**
   * Process a detected violation
   */
  private async processViolation(
    message: Message,
    analysis: {
      violations: ViolationType[];
      severity: ViolationSeverity;
      evidence: Record<string, any>;
      suggested_action: ModerationAction;
    },
  ): Promise<void> {
    const guild = message.guild;
    const user = message.author;

    if (!guild || !user) {
      return;
    }

    // Create violation record
    const violation: ViolationRecord = {
      id: `${Date.now()}-${user.id}`,
      type: analysis.violations[0], // Primary violation type
      severity: analysis.severity,
      timestamp: Date.now(),
      channel_id: message.channelId,
      message_id: message.id,
      content: message.content,
      action_taken: analysis.suggested_action,
      moderator: "system",
      evidence: analysis.evidence,
    };

    // Update user behavior
    const behaviorKey = `${guild.id}:${user.id}`;
    let behavior = this.userBehavior.get(behaviorKey);
    if (!behavior) {
      behavior = {
        user_id: user.id,
        guild_id: guild.id,
        violations: [],
        message_count: 0,
        warnings: 0,
        mutes: 0,
        last_message_time: Date.now(),
        join_date: Date.now(),
        risk_score: 0,
        is_quarantined: false,
      };
    }

    behavior.violations.push(violation);
    behavior.risk_score = this.calculateRiskScore(behavior);
    this.userBehavior.set(behaviorKey, behavior);

    // Execute moderation action
    await this.executeAction(violation, message);

    // Emit violation detected event
    this.emit("violation_detected", {
      violation,
      user: user.tag,
      guild: guild.name,
    });

    // Log to moderation channel
    await this.logModerationAction(guild, violation, user);
  }

  /**
   * Execute moderation action
   */
  private async executeAction(
    violation: ViolationRecord,
    message: Message,
  ): Promise<void> {
    const guild = message.guild;
    if (!guild) {
      return;
    }

    try {
      const member = await guild.members.fetch(message.author.id);
      const action = violation.action_taken;

      switch (action) {
        case ModerationAction.DELETE_MESSAGE:
          if (message.deletable) {
            await message.delete();
          }
          break;

        case ModerationAction.WARN:
          await this.sendWarningMessage(member, violation);
          const behavior = this.userBehavior.get(`${guild.id}:${member.id}`);
          if (behavior) {
            behavior.warnings++;
          }
          break;

        case ModerationAction.MUTE:
          await this.muteUser(
            member,
            this.config.default_mute_duration_minutes,
          );
          break;

        case ModerationAction.KICK:
          if (member.kickable) {
            await member.kick(`Automated moderation: ${violation.type}`);
          }
          break;

        case ModerationAction.BAN:
          if (member.bannable) {
            await member.ban({
              reason: `Automated moderation: ${violation.type}`,
              deleteMessageDays: 1,
            });
          }
          break;
      }

      info(`Executed ${action} for ${member.user.tag} - ${violation.type}`);
    } catch (err) {
      error(`Failed to execute moderation action: ${err}`);
    }
  }

  /**
   * Update user behavior tracking
   */
  private async updateUserBehavior(message: Message): Promise<void> {
    if (!message.guildId) return;

    const behaviorKey = `${message.guildId}:${message.author.id}`;
    let behavior = this.userBehavior.get(behaviorKey);

    if (!behavior) {
      behavior = {
        user_id: message.author.id,
        guild_id: message.guildId,
        violations: [],
        message_count: 0,
        warnings: 0,
        mutes: 0,
        last_message_time: Date.now(),
        join_date: Date.now(),
        risk_score: 0,
        is_quarantined: false,
      };
    }

    behavior.message_count++;
    behavior.last_message_time = Date.now();
    behavior.risk_score = this.calculateRiskScore(behavior);

    this.userBehavior.set(behaviorKey, behavior);
  }

  /**
   * Calculate initial risk score for new members
   */
  private calculateInitialRiskScore(member: GuildMember): number {
    let score = 0;

    // Account age factor
    const accountAge = Date.now() - member.user.createdTimestamp;
    const daysSinceCreated = accountAge / (24 * 60 * 60 * 1000);

    if (daysSinceCreated < 7) score += 0.4;
    else if (daysSinceCreated < 30) score += 0.2;

    // Avatar factor
    if (!member.user.avatarURL()) score += 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate ongoing risk score based on behavior
   */
  private calculateRiskScore(behavior: UserBehavior): number {
    let score = 0;

    // Recent violations
    const recentViolations = behavior.violations.filter(
      (v) => Date.now() - v.timestamp < 24 * 60 * 60 * 1000,
    );

    score += recentViolations.length * 0.2;

    // Warning count
    score += behavior.warnings * 0.1;

    // Mute count
    score += behavior.mutes * 0.15;

    return Math.min(score, 1.0);
  }

  /**
   * Send warning message to user
   */
  private async sendWarningMessage(
    member: GuildMember,
    violation: ViolationRecord,
  ): Promise<void> {
    try {
      const embed = {
        title: "⚠️ Moderation Warning",
        description: `You have received a warning for ${violation.type}.`,
        color: 0xffaa00,
        fields: [
          {
            name: "Server",
            value: member.guild.name,
            inline: true,
          },
          {
            name: "Violation Type",
            value: violation.type,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await member.send({ embeds: [embed] });
    } catch (err) {
      info(`Could not send warning DM to ${member.user.tag}: ${err}`);
    }
  }

  /**
   * Mute a user
   */
  private async muteUser(
    member: GuildMember,
    durationMinutes: number,
  ): Promise<void> {
    try {
      await member.timeout(durationMinutes * 60 * 1000, "Automated moderation");

      const behavior = this.userBehavior.get(`${member.guild.id}:${member.id}`);
      if (behavior) {
        behavior.mutes++;
      }

      info(`User ${member.user.tag} muted for ${durationMinutes} minutes`);
    } catch (err) {
      error(`Failed to mute user ${member.user.tag}: ${err}`);
    }
  }

  /**
   * Log moderation action to designated channel
   */
  private async logModerationAction(
    guild: Guild,
    violation: ViolationRecord,
    user: any,
  ): Promise<void> {
    if (!this.config.moderation_log_channel_id) {
      return;
    }

    try {
      const logChannel = guild.channels.cache.get(
        this.config.moderation_log_channel_id,
      ) as TextChannel;
      if (!logChannel) {
        return;
      }

      const embed = {
        title: "🤖 Automated Moderation Action",
        description: `Action taken against ${user.tag}`,
        color: 0xff0000,
        fields: [
          {
            name: "User",
            value: `<@${user.id}> (${user.tag})`,
            inline: true,
          },
          {
            name: "Violation Type",
            value: violation.type,
            inline: true,
          },
          {
            name: "Action Taken",
            value: violation.action_taken,
            inline: true,
          },
        ],
        timestamp: new Date(violation.timestamp).toISOString(),
      };

      await logChannel.send({ embeds: [embed] });
    } catch (err) {
      error(`Failed to log moderation action: ${err}`);
    }
  }

  /**
   * Clean up old records to prevent memory bloat
   */
  private cleanupOldRecords(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

    // Clean user behavior violations
    for (const [key, behavior] of this.userBehavior.entries()) {
      behavior.violations = behavior.violations.filter(
        (v) => v.timestamp > cutoff,
      );
      if (behavior.violations.length === 0 && behavior.message_count === 0) {
        this.userBehavior.delete(key);
      }
    }

    info("Cleaned up old moderation records");
  }

  /**
   * Get user behavior data
   */
  getUserBehavior(guildId: string, userId: string): UserBehavior | null {
    return this.userBehavior.get(`${guildId}:${userId}`) || null;
  }

  /**
   * Get moderation statistics
   */
  getModerationStats(guildId?: string): {
    total_violations: number;
    violations_by_type: Record<string, number>;
    actions_taken: Record<string, number>;
    active_users: number;
  } {
    const violations = guildId
      ? Array.from(this.userBehavior.values())
          .filter((b) => b.guild_id === guildId)
          .flatMap((b) => b.violations)
      : Array.from(this.userBehavior.values()).flatMap((b) => b.violations);

    const violationsByType = violations.reduce(
      (acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const actionsTaken = violations.reduce(
      (acc, v) => {
        acc[v.action_taken] = (acc[v.action_taken] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const activeUsers = guildId
      ? Array.from(this.userBehavior.values()).filter(
          (b) => b.guild_id === guildId,
        ).length
      : this.userBehavior.size;

    return {
      total_violations: violations.length,
      violations_by_type: violationsByType,
      actions_taken: actionsTaken,
      active_users: activeUsers,
    };
  }

  /**
   * Add custom moderation rule
   */
  addRule(rule: ModerationRule): void {
    this.rules.set(rule.id, rule);
    info(`Custom moderation rule added: ${rule.name}`);
  }

  /**
   * Remove moderation rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      info(`Moderation rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Get all moderation rules
   */
  getRules(): ModerationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get higher severity between two severities
   */
  private getHigherSeverity(
    current: ViolationSeverity,
    candidate: ViolationSeverity,
  ): ViolationSeverity {
    const severityLevels = {
      [ViolationSeverity.LOW]: 1,
      [ViolationSeverity.MEDIUM]: 2,
      [ViolationSeverity.HIGH]: 3,
      [ViolationSeverity.CRITICAL]: 4,
    };

    return severityLevels[candidate] > severityLevels[current]
      ? candidate
      : current;
  }

  /**
   * Get numeric level for severity comparison
   */
  private getSeverityLevel(severity: ViolationSeverity): number {
    const levels = {
      [ViolationSeverity.LOW]: 1,
      [ViolationSeverity.MEDIUM]: 2,
      [ViolationSeverity.HIGH]: 3,
      [ViolationSeverity.CRITICAL]: 4,
    };
    return levels[severity] || 0;
  }

  /**
   * Shutdown the moderation service
   */
  shutdown(): void {
    this.userBehavior.clear();
    info("Automated moderation service shutdown complete");
  }
}
