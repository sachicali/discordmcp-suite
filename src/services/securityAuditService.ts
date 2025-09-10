/**
 * @fileoverview Security Audit Service
 * @description Comprehensive security auditing system for Discord servers
 * including permission analysis, security scanning, vulnerability detection,
 * and compliance monitoring.
 *
 * Features:
 * - Permission vulnerability scanning
 * - Security configuration analysis
 * - Compliance monitoring and reporting
 * - Automated security recommendations
 * - Threat detection and alerting
 * - Security metrics and dashboards
 *
 * @author MCP Discord Team
 * @version 1.0.0
 * @since 1.4.0
 */

import { EventEmitter } from "events";
import {
  Client,
  Guild,
  GuildMember,
  Role,
  TextChannel,
  PermissionsBitField,
} from "discord.js";
import { info, error } from "../logger.js";

/**
 * Security vulnerability types
 */
export enum VulnerabilityType {
  EXCESSIVE_PERMISSIONS = "excessive_permissions",
  ADMIN_ROLE_ISSUES = "admin_role_issues",
  EVERYONE_PERMISSIONS = "everyone_permissions",
  BOT_PERMISSIONS = "bot_permissions",
  CHANNEL_VULNERABILITIES = "channel_vulnerabilities",
  WEBHOOK_SECURITY = "webhook_security",
  INTEGRATION_RISKS = "integration_risks",
  MEMBER_SCREENING = "member_screening",
  CONTENT_FILTERING = "content_filtering",
  BACKUP_CONFIGURATION = "backup_configuration",
}

/**
 * Security severity levels
 */
export enum SecuritySeverity {
  INFO = "info",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Security compliance standards
 */
export enum ComplianceStandard {
  BASIC_SECURITY = "basic_security",
  ENHANCED_PRIVACY = "enhanced_privacy",
  CORPORATE_SECURITY = "corporate_security",
  EDUCATIONAL_SAFETY = "educational_safety",
  COMMUNITY_GUIDELINES = "community_guidelines",
}

/**
 * Security vulnerability finding
 */
export interface SecurityVulnerability {
  id: string;
  type: VulnerabilityType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  affected_resource: {
    type: "guild" | "role" | "channel" | "member" | "bot" | "integration";
    id: string;
    name: string;
  };
  evidence: Record<string, any>;
  recommendation: string;
  remediation_steps: string[];
  compliance_impact?: ComplianceStandard[];
  discovered_at: Date;
  resolved_at?: Date;
  false_positive?: boolean;
}

/**
 * Security audit report
 */
export interface SecurityAuditReport {
  audit_id: string;
  guild_id: string;
  guild_name: string;
  audit_date: Date;
  auditor: string;
  scope: string[];
  overall_score: number; // 0-100
  vulnerabilities: SecurityVulnerability[];
  compliance_status: Record<
    ComplianceStandard,
    {
      compliant: boolean;
      score: number;
      missing_requirements: string[];
    }
  >;
  recommendations: Array<{
    priority: SecuritySeverity;
    action: string;
    estimated_effort: "low" | "medium" | "high";
  }>;
  metrics: {
    total_roles: number;
    admin_roles: number;
    dangerous_permissions: number;
    public_channels: number;
    bot_count: number;
    webhook_count: number;
    integration_count: number;
  };
}

/**
 * Security configuration
 */
export interface SecurityAuditConfig {
  enabled: boolean;
  auto_audit_interval_hours: number;
  compliance_standards: ComplianceStandard[];
  alert_thresholds: Record<SecuritySeverity, number>;
  exclude_bots: boolean;
  exclude_managed_roles: boolean;
  notification_channel_id?: string;
  webhook_alerts_url?: string;
}

/**
 * Dangerous permissions that require special attention
 */
const DANGEROUS_PERMISSIONS = [
  "ADMINISTRATOR",
  "MANAGE_GUILD",
  "MANAGE_ROLES",
  "MANAGE_CHANNELS",
  "MANAGE_WEBHOOKS",
  "BAN_MEMBERS",
  "KICK_MEMBERS",
  "MANAGE_MESSAGES",
  "MENTION_EVERYONE",
  "MANAGE_NICKNAMES",
  "MUTE_MEMBERS",
  "DEAFEN_MEMBERS",
  "MOVE_MEMBERS",
];

/**
 * Security Audit Service
 */
export class SecurityAuditService extends EventEmitter {
  private client: Client | null = null;
  private config: SecurityAuditConfig;
  private auditHistory: Map<string, SecurityAuditReport[]> = new Map();
  private scheduledAudits: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<SecurityAuditConfig>) {
    super();

    this.config = {
      enabled: true,
      auto_audit_interval_hours: 24,
      compliance_standards: [ComplianceStandard.BASIC_SECURITY],
      alert_thresholds: {
        [SecuritySeverity.INFO]: 50,
        [SecuritySeverity.LOW]: 25,
        [SecuritySeverity.MEDIUM]: 10,
        [SecuritySeverity.HIGH]: 5,
        [SecuritySeverity.CRITICAL]: 1,
      },
      exclude_bots: true,
      exclude_managed_roles: true,
      ...config,
    };
  }

  /**
   * Initialize the security audit service
   */
  initialize(client: Client): void {
    this.client = client;

    if (this.config.enabled) {
      // Schedule automatic audits for all guilds
      this.scheduleAutoAudits();
    }

    info("Security audit service initialized");
    this.emit("service_initialized");
  }

  /**
   * Schedule automatic security audits
   */
  private scheduleAutoAudits(): void {
    if (!this.client || !this.config.enabled) return;

    for (const guild of this.client.guilds.cache.values()) {
      this.scheduleGuildAudit(guild.id);
    }

    // Schedule audits for new guilds
    this.client.on("guildCreate", (guild) => {
      this.scheduleGuildAudit(guild.id);
    });

    this.client.on("guildDelete", (guild) => {
      this.cancelGuildAudit(guild.id);
    });
  }

  /**
   * Schedule audit for a specific guild
   */
  private scheduleGuildAudit(guildId: string): void {
    if (this.scheduledAudits.has(guildId)) {
      clearInterval(this.scheduledAudits.get(guildId)!);
    }

    const interval = setInterval(
      async () => {
        try {
          await this.auditGuild(guildId, "automated");
        } catch (err) {
          error(`Automated security audit failed for guild ${guildId}: ${err}`);
        }
      },
      this.config.auto_audit_interval_hours * 60 * 60 * 1000,
    );

    this.scheduledAudits.set(guildId, interval);
  }

  /**
   * Cancel scheduled audit for a guild
   */
  private cancelGuildAudit(guildId: string): void {
    const interval = this.scheduledAudits.get(guildId);
    if (interval) {
      clearInterval(interval);
      this.scheduledAudits.delete(guildId);
    }
  }

  /**
   * Perform comprehensive security audit of a guild
   */
  async auditGuild(
    guildId: string,
    auditor: string = "manual",
  ): Promise<SecurityAuditReport> {
    if (!this.client) {
      throw new Error("Security audit service not initialized");
    }

    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) {
      throw new Error(`Guild ${guildId} not found`);
    }

    const auditId = `audit_${guildId}_${Date.now()}`;
    const startTime = Date.now();

    info(`Starting security audit for guild: ${guild.name} (${guild.id})`);

    const vulnerabilities: SecurityVulnerability[] = [];

    // Perform various security checks
    vulnerabilities.push(...(await this.auditRolePermissions(guild)));
    vulnerabilities.push(...(await this.auditChannelSecurity(guild)));
    vulnerabilities.push(...(await this.auditBotPermissions(guild)));
    vulnerabilities.push(...(await this.auditWebhookSecurity(guild)));
    vulnerabilities.push(...(await this.auditMemberScreening(guild)));
    vulnerabilities.push(...(await this.auditServerConfiguration(guild)));

    // Calculate overall security score
    const overallScore = this.calculateSecurityScore(vulnerabilities);

    // Assess compliance status
    const complianceStatus = this.assessCompliance(guild, vulnerabilities);

    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilities);

    // Gather metrics
    const metrics = await this.gatherSecurityMetrics(guild);

    const report: SecurityAuditReport = {
      audit_id: auditId,
      guild_id: guild.id,
      guild_name: guild.name,
      audit_date: new Date(),
      auditor,
      scope: [
        "roles",
        "channels",
        "bots",
        "webhooks",
        "members",
        "configuration",
      ],
      overall_score: overallScore,
      vulnerabilities: vulnerabilities.sort(
        (a, b) =>
          this.severityWeight(b.severity) - this.severityWeight(a.severity),
      ),
      compliance_status: complianceStatus,
      recommendations,
      metrics,
    };

    // Store audit history
    const guildHistory = this.auditHistory.get(guildId) || [];
    guildHistory.unshift(report);
    if (guildHistory.length > 10) {
      // Keep last 10 audits
      guildHistory.splice(10);
    }
    this.auditHistory.set(guildId, guildHistory);

    // Check alert thresholds and notify
    await this.checkAlertsAndNotify(report);

    const duration = Date.now() - startTime;
    info(
      `Security audit completed for ${guild.name} in ${duration}ms. Score: ${overallScore}/100, Vulnerabilities: ${vulnerabilities.length}`,
    );

    this.emit("audit_completed", report);

    return report;
  }

  /**
   * Audit role permissions for vulnerabilities
   */
  private async auditRolePermissions(
    guild: Guild,
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    await guild.roles.fetch();

    for (const role of guild.roles.cache.values()) {
      if (this.config.exclude_managed_roles && role.managed) continue;

      // Check for excessive administrator permissions
      if (
        role.permissions.has(PermissionsBitField.Flags.Administrator) &&
        role.name !== "@everyone"
      ) {
        const memberCount = role.members.size;

        if (
          memberCount > 10 ||
          role.name.toLowerCase().includes("everyone") ||
          role.name.toLowerCase().includes("member")
        ) {
          vulnerabilities.push({
            id: `admin_role_${role.id}`,
            type: VulnerabilityType.ADMIN_ROLE_ISSUES,
            severity: SecuritySeverity.CRITICAL,
            title: "Excessive Administrator Permissions",
            description: `Role "${role.name}" has Administrator permissions with ${memberCount} members`,
            affected_resource: {
              type: "role",
              id: role.id,
              name: role.name,
            },
            evidence: {
              member_count: memberCount,
              permissions: role.permissions.toArray(),
              is_mentionable: role.mentionable,
              is_hoisted: role.hoist,
            },
            recommendation:
              "Remove Administrator permission and grant only specific permissions needed",
            remediation_steps: [
              "Remove Administrator permission from the role",
              "Grant specific permissions (Manage Messages, Kick Members, etc.) as needed",
              "Consider creating separate roles for different permission levels",
              "Review all members with this role and remove if not needed",
            ],
            compliance_impact: [
              ComplianceStandard.BASIC_SECURITY,
              ComplianceStandard.CORPORATE_SECURITY,
            ],
            discovered_at: new Date(),
          });
        }
      }

      // Check for dangerous permissions on @everyone role
      if (role.name === "@everyone") {
        const dangerousPerms = DANGEROUS_PERMISSIONS.filter((perm) =>
          role.permissions.has(
            PermissionsBitField.Flags[
              perm as keyof typeof PermissionsBitField.Flags
            ],
          ),
        );

        if (dangerousPerms.length > 0) {
          vulnerabilities.push({
            id: `everyone_perms_${guild.id}`,
            type: VulnerabilityType.EVERYONE_PERMISSIONS,
            severity: SecuritySeverity.HIGH,
            title: "Dangerous @everyone Permissions",
            description: `The @everyone role has dangerous permissions: ${dangerousPerms.join(", ")}`,
            affected_resource: {
              type: "role",
              id: role.id,
              name: role.name,
            },
            evidence: {
              dangerous_permissions: dangerousPerms,
              total_members: guild.memberCount,
            },
            recommendation: "Remove dangerous permissions from @everyone role",
            remediation_steps: [
              "Review each dangerous permission on @everyone role",
              "Remove unnecessary permissions",
              "Create specific roles for members who need these permissions",
              "Test permission changes in a staging environment if possible",
            ],
            compliance_impact: [ComplianceStandard.BASIC_SECURITY],
            discovered_at: new Date(),
          });
        }
      }

      // Check for roles with both dangerous permissions and high member count
      const roleDangerousPerms = DANGEROUS_PERMISSIONS.filter((perm) =>
        role.permissions.has(
          PermissionsBitField.Flags[
            perm as keyof typeof PermissionsBitField.Flags
          ],
        ),
      );

      if (roleDangerousPerms.length >= 3 && role.members.size > 20) {
        vulnerabilities.push({
          id: `excessive_perms_${role.id}`,
          type: VulnerabilityType.EXCESSIVE_PERMISSIONS,
          severity: SecuritySeverity.MEDIUM,
          title: "Role with Excessive Permissions",
          description: `Role "${role.name}" has ${roleDangerousPerms.length} dangerous permissions and ${role.members.size} members`,
          affected_resource: {
            type: "role",
            id: role.id,
            name: role.name,
          },
          evidence: {
            dangerous_permissions: roleDangerousPerms,
            member_count: role.members.size,
            is_mentionable: role.mentionable,
          },
          recommendation:
            "Review and reduce permissions or split into multiple roles",
          remediation_steps: [
            "Audit which permissions are actually needed",
            "Consider splitting into multiple specialized roles",
            "Review member list and remove unnecessary assignments",
            "Document the purpose and required permissions for this role",
          ],
          discovered_at: new Date(),
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Audit channel security configurations
   */
  private async auditChannelSecurity(
    guild: Guild,
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    for (const channel of guild.channels.cache.values()) {
      if (channel.isTextBased() && channel instanceof TextChannel) {
        // Check for channels with @everyone send permissions
        const everyoneOverwrites = channel.permissionOverwrites.cache.get(
          guild.id,
        );
        if (
          everyoneOverwrites &&
          everyoneOverwrites.allow.has(
            PermissionsBitField.Flags.SendMessages,
          ) &&
          (channel.name.includes("admin") ||
            channel.name.includes("mod") ||
            channel.name.includes("staff"))
        ) {
          vulnerabilities.push({
            id: `channel_perms_${channel.id}`,
            type: VulnerabilityType.CHANNEL_VULNERABILITIES,
            severity: SecuritySeverity.HIGH,
            title: "Administrative Channel Accessible to Everyone",
            description: `Channel "${channel.name}" appears to be administrative but allows @everyone to send messages`,
            affected_resource: {
              type: "channel",
              id: channel.id,
              name: channel.name,
            },
            evidence: {
              channel_name: channel.name,
              everyone_can_send: true,
              permission_overwrites: channel.permissionOverwrites.cache.size,
            },
            recommendation: "Restrict access to administrative channels",
            remediation_steps: [
              "Remove Send Messages permission from @everyone for this channel",
              "Add specific roles that need access to this channel",
              "Consider renaming the channel if it's not actually administrative",
              "Review all permission overwrites for this channel",
            ],
            discovered_at: new Date(),
          });
        }

        // Check for channels with webhook management permissions
        if (
          everyoneOverwrites &&
          everyoneOverwrites.allow.has(PermissionsBitField.Flags.ManageWebhooks)
        ) {
          vulnerabilities.push({
            id: `webhook_perms_${channel.id}`,
            type: VulnerabilityType.WEBHOOK_SECURITY,
            severity: SecuritySeverity.CRITICAL,
            title: "Channel Allows Webhook Management",
            description: `Channel "${channel.name}" allows @everyone to manage webhooks`,
            affected_resource: {
              type: "channel",
              id: channel.id,
              name: channel.name,
            },
            evidence: {
              channel_name: channel.name,
              everyone_can_manage_webhooks: true,
            },
            recommendation:
              "Remove webhook management permissions from @everyone",
            remediation_steps: [
              "Remove Manage Webhooks permission from @everyone",
              "Grant webhook permissions only to trusted roles",
              "Audit existing webhooks in this channel",
              "Consider using bot commands instead of webhooks where possible",
            ],
            compliance_impact: [
              ComplianceStandard.BASIC_SECURITY,
              ComplianceStandard.CORPORATE_SECURITY,
            ],
            discovered_at: new Date(),
          });
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Audit bot permissions and configurations
   */
  private async auditBotPermissions(
    guild: Guild,
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    await guild.members.fetch();
    const bots = guild.members.cache.filter((member) => member.user.bot);

    for (const bot of bots.values()) {
      // Check for bots with Administrator permission
      if (bot.permissions.has(PermissionsBitField.Flags.Administrator)) {
        vulnerabilities.push({
          id: `bot_admin_${bot.id}`,
          type: VulnerabilityType.BOT_PERMISSIONS,
          severity: SecuritySeverity.HIGH,
          title: "Bot with Administrator Permissions",
          description: `Bot "${bot.user.username}" has Administrator permissions`,
          affected_resource: {
            type: "bot",
            id: bot.id,
            name: bot.user.username,
          },
          evidence: {
            bot_name: bot.user.username,
            has_admin: true,
            permissions: bot.permissions.toArray(),
            roles: bot.roles.cache.map((r) => ({ id: r.id, name: r.name })),
          },
          recommendation:
            "Remove Administrator permission and grant only necessary permissions",
          remediation_steps: [
            "Identify what permissions the bot actually needs",
            "Remove Administrator permission from bot roles",
            "Grant specific permissions required for bot functionality",
            "Test bot functionality after permission changes",
            "Review bot's source code or documentation for required permissions",
          ],
          discovered_at: new Date(),
        });
      }

      // Check for multiple bots with similar dangerous permissions
      const botDangerousPerms = DANGEROUS_PERMISSIONS.filter((perm) =>
        bot.permissions.has(
          PermissionsBitField.Flags[
            perm as keyof typeof PermissionsBitField.Flags
          ],
        ),
      );

      if (botDangerousPerms.length >= 5) {
        vulnerabilities.push({
          id: `bot_excessive_${bot.id}`,
          type: VulnerabilityType.BOT_PERMISSIONS,
          severity: SecuritySeverity.MEDIUM,
          title: "Bot with Excessive Permissions",
          description: `Bot "${bot.user.username}" has ${botDangerousPerms.length} dangerous permissions`,
          affected_resource: {
            type: "bot",
            id: bot.id,
            name: bot.user.username,
          },
          evidence: {
            dangerous_permissions: botDangerousPerms,
            permission_count: botDangerousPerms.length,
          },
          recommendation:
            "Review and reduce bot permissions to minimum required",
          remediation_steps: [
            "Audit bot's actual functionality requirements",
            "Remove unnecessary dangerous permissions",
            "Test bot functionality with reduced permissions",
            "Document required permissions for this bot",
          ],
          discovered_at: new Date(),
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Audit webhook security
   */
  private async auditWebhookSecurity(
    guild: Guild,
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const webhooks = await guild.fetchWebhooks();

      if (webhooks.size > 20) {
        vulnerabilities.push({
          id: `webhook_count_${guild.id}`,
          type: VulnerabilityType.WEBHOOK_SECURITY,
          severity: SecuritySeverity.MEDIUM,
          title: "High Number of Webhooks",
          description: `Server has ${webhooks.size} webhooks, which may indicate security risks`,
          affected_resource: {
            type: "guild",
            id: guild.id,
            name: guild.name,
          },
          evidence: {
            webhook_count: webhooks.size,
            webhook_channels: Array.from(
              new Set(webhooks.map((w) => w.channelId)),
            ),
          },
          recommendation: "Review and remove unnecessary webhooks",
          remediation_steps: [
            "Audit each webhook to determine if it's still needed",
            "Remove unused or abandoned webhooks",
            "Consider consolidating similar webhooks",
            "Implement webhook monitoring and management",
          ],
          discovered_at: new Date(),
        });
      }

      // Check for webhooks with suspicious names or no owners
      for (const webhook of webhooks.values()) {
        if (
          !webhook.owner ||
          webhook.name.toLowerCase().includes("hack") ||
          webhook.name.toLowerCase().includes("admin") ||
          webhook.name.toLowerCase().includes("system")
        ) {
          vulnerabilities.push({
            id: `suspicious_webhook_${webhook.id}`,
            type: VulnerabilityType.WEBHOOK_SECURITY,
            severity: SecuritySeverity.HIGH,
            title: "Suspicious Webhook Detected",
            description: `Webhook "${webhook.name}" has suspicious characteristics`,
            affected_resource: {
              type: "guild",
              id: guild.id,
              name: guild.name,
            },
            evidence: {
              webhook_name: webhook.name,
              has_owner: !!webhook.owner,
              owner_id: webhook.owner?.id,
              channel_id: webhook.channelId,
            },
            recommendation: "Review and potentially remove suspicious webhook",
            remediation_steps: [
              "Verify the purpose and legitimacy of this webhook",
              "Check who created the webhook and when",
              "Remove the webhook if it's not legitimate",
              "Audit the channel for any malicious messages from this webhook",
            ],
            discovered_at: new Date(),
          });
        }
      }
    } catch (err) {
      // Webhook fetch failed - could be permissions issue
      info(`Could not fetch webhooks for guild ${guild.name}: ${err}`);
    }

    return vulnerabilities;
  }

  /**
   * Audit member screening and verification
   */
  private async auditMemberScreening(
    guild: Guild,
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check verification level
    if (guild.verificationLevel < 2) {
      // Less than Medium verification
      vulnerabilities.push({
        id: `verification_level_${guild.id}`,
        type: VulnerabilityType.MEMBER_SCREENING,
        severity: SecuritySeverity.MEDIUM,
        title: "Low Server Verification Level",
        description: `Server verification level is ${guild.verificationLevel} (recommended: 2 or higher)`,
        affected_resource: {
          type: "guild",
          id: guild.id,
          name: guild.name,
        },
        evidence: {
          current_verification_level: guild.verificationLevel,
          recommended_level: 2,
        },
        recommendation:
          "Increase server verification level to Medium or higher",
        remediation_steps: [
          "Go to Server Settings > Moderation",
          "Set Verification Level to Medium or High",
          "Consider enabling member screening questions",
          "Monitor for any impact on legitimate new members",
        ],
        discovered_at: new Date(),
      });
    }

    // Check explicit content filter
    if (guild.explicitContentFilter === 0) {
      // No filter
      vulnerabilities.push({
        id: `content_filter_${guild.id}`,
        type: VulnerabilityType.CONTENT_FILTERING,
        severity: SecuritySeverity.MEDIUM,
        title: "No Explicit Content Filter",
        description: "Server has no explicit content filtering enabled",
        affected_resource: {
          type: "guild",
          id: guild.id,
          name: guild.name,
        },
        evidence: {
          explicit_content_filter: guild.explicitContentFilter,
        },
        recommendation: "Enable explicit content filtering",
        remediation_steps: [
          "Go to Server Settings > Moderation",
          "Set Explicit Media Content Filter to 'Members without roles' or 'All members'",
          "Consider additional content moderation bots",
          "Establish clear community guidelines",
        ],
        compliance_impact: [
          ComplianceStandard.EDUCATIONAL_SAFETY,
          ComplianceStandard.COMMUNITY_GUIDELINES,
        ],
        discovered_at: new Date(),
      });
    }

    return vulnerabilities;
  }

  /**
   * Audit server configuration
   */
  private async auditServerConfiguration(
    guild: Guild,
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check if server has no description (could indicate lack of moderation)
    if (!guild.description && guild.memberCount > 100) {
      vulnerabilities.push({
        id: `no_description_${guild.id}`,
        type: VulnerabilityType.MEMBER_SCREENING,
        severity: SecuritySeverity.LOW,
        title: "Large Server Without Description",
        description:
          "Large server lacks a description which may confuse new members about purpose and rules",
        affected_resource: {
          type: "guild",
          id: guild.id,
          name: guild.name,
        },
        evidence: {
          member_count: guild.memberCount,
          has_description: !!guild.description,
        },
        recommendation:
          "Add a clear server description explaining purpose and basic rules",
        remediation_steps: [
          "Go to Server Settings > Overview",
          "Add a description explaining the server's purpose",
          "Include basic rules and expected behavior",
          "Consider adding links to full rules or guidelines",
        ],
        discovered_at: new Date(),
      });
    }

    return vulnerabilities;
  }

  /**
   * Calculate overall security score (0-100)
   */
  private calculateSecurityScore(
    vulnerabilities: SecurityVulnerability[],
  ): number {
    let score = 100;

    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case SecuritySeverity.CRITICAL:
          score -= 25;
          break;
        case SecuritySeverity.HIGH:
          score -= 15;
          break;
        case SecuritySeverity.MEDIUM:
          score -= 10;
          break;
        case SecuritySeverity.LOW:
          score -= 5;
          break;
        case SecuritySeverity.INFO:
          score -= 2;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Assess compliance with security standards
   */
  private assessCompliance(
    guild: Guild,
    vulnerabilities: SecurityVulnerability[],
  ): Record<
    ComplianceStandard,
    {
      compliant: boolean;
      score: number;
      missing_requirements: string[];
    }
  > {
    const result: Record<ComplianceStandard, any> = {};

    for (const standard of this.config.compliance_standards) {
      const relevantVulns = vulnerabilities.filter((v) =>
        v.compliance_impact?.includes(standard),
      );

      const criticalVulns = relevantVulns.filter(
        (v) => v.severity === SecuritySeverity.CRITICAL,
      ).length;
      const highVulns = relevantVulns.filter(
        (v) => v.severity === SecuritySeverity.HIGH,
      ).length;

      const compliant = criticalVulns === 0 && highVulns <= 2;
      const score = Math.max(
        0,
        100 - criticalVulns * 40 - highVulns * 20 - relevantVulns.length * 5,
      );

      result[standard] = {
        compliant,
        score,
        missing_requirements: relevantVulns.map((v) => v.title),
      };
    }

    return result;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    vulnerabilities: SecurityVulnerability[],
  ): Array<{
    priority: SecuritySeverity;
    action: string;
    estimated_effort: "low" | "medium" | "high";
  }> {
    const recommendations = [];

    const criticalCount = vulnerabilities.filter(
      (v) => v.severity === SecuritySeverity.CRITICAL,
    ).length;
    const highCount = vulnerabilities.filter(
      (v) => v.severity === SecuritySeverity.HIGH,
    ).length;

    if (criticalCount > 0) {
      recommendations.push({
        priority: SecuritySeverity.CRITICAL,
        action: `Address ${criticalCount} critical security vulnerabilities immediately`,
        estimated_effort: "high" as const,
      });
    }

    if (highCount > 0) {
      recommendations.push({
        priority: SecuritySeverity.HIGH,
        action: `Review and fix ${highCount} high-severity security issues`,
        estimated_effort: "medium" as const,
      });
    }

    const adminRoleIssues = vulnerabilities.filter(
      (v) => v.type === VulnerabilityType.ADMIN_ROLE_ISSUES,
    ).length;
    if (adminRoleIssues > 0) {
      recommendations.push({
        priority: SecuritySeverity.HIGH,
        action:
          "Implement role-based access control with least privilege principle",
        estimated_effort: "high" as const,
      });
    }

    const botIssues = vulnerabilities.filter(
      (v) => v.type === VulnerabilityType.BOT_PERMISSIONS,
    ).length;
    if (botIssues > 0) {
      recommendations.push({
        priority: SecuritySeverity.MEDIUM,
        action: "Audit and reduce bot permissions to minimum required",
        estimated_effort: "medium" as const,
      });
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Gather security metrics
   */
  private async gatherSecurityMetrics(guild: Guild): Promise<{
    total_roles: number;
    admin_roles: number;
    dangerous_permissions: number;
    public_channels: number;
    bot_count: number;
    webhook_count: number;
    integration_count: number;
  }> {
    await guild.roles.fetch();
    await guild.members.fetch();

    const adminRoles = guild.roles.cache.filter((r) =>
      r.permissions.has(PermissionsBitField.Flags.Administrator),
    ).size;

    const dangerousPermissions = guild.roles.cache.reduce((count, role) => {
      return (
        count +
        DANGEROUS_PERMISSIONS.filter((perm) =>
          role.permissions.has(
            PermissionsBitField.Flags[
              perm as keyof typeof PermissionsBitField.Flags
            ],
          ),
        ).length
      );
    }, 0);

    const publicChannels = guild.channels.cache.filter((channel) => {
      if (!channel.isTextBased()) return false;
      const overwrites = channel.permissionOverwrites.cache.get(guild.id);
      return (
        !overwrites ||
        !overwrites.deny.has(PermissionsBitField.Flags.ViewChannel)
      );
    }).size;

    const botCount = guild.members.cache.filter((m) => m.user.bot).size;

    let webhookCount = 0;
    try {
      const webhooks = await guild.fetchWebhooks();
      webhookCount = webhooks.size;
    } catch {
      // Ignore webhook fetch errors
    }

    let integrationCount = 0;
    try {
      const integrations = await guild.fetchIntegrations();
      integrationCount = integrations.size;
    } catch {
      // Ignore integration fetch errors
    }

    return {
      total_roles: guild.roles.cache.size,
      admin_roles: adminRoles,
      dangerous_permissions: dangerousPermissions,
      public_channels: publicChannels,
      bot_count: botCount,
      webhook_count: webhookCount,
      integration_count: integrationCount,
    };
  }

  /**
   * Check alert thresholds and send notifications
   */
  private async checkAlertsAndNotify(
    report: SecurityAuditReport,
  ): Promise<void> {
    const criticalCount = report.vulnerabilities.filter(
      (v) => v.severity === SecuritySeverity.CRITICAL,
    ).length;
    const highCount = report.vulnerabilities.filter(
      (v) => v.severity === SecuritySeverity.HIGH,
    ).length;

    let shouldAlert = false;
    let alertLevel = SecuritySeverity.INFO;

    if (
      criticalCount >= this.config.alert_thresholds[SecuritySeverity.CRITICAL]
    ) {
      shouldAlert = true;
      alertLevel = SecuritySeverity.CRITICAL;
    } else if (
      highCount >= this.config.alert_thresholds[SecuritySeverity.HIGH]
    ) {
      shouldAlert = true;
      alertLevel = SecuritySeverity.HIGH;
    }

    if (shouldAlert) {
      await this.sendSecurityAlert(report, alertLevel);
    }
  }

  /**
   * Send security alert notification
   */
  private async sendSecurityAlert(
    report: SecurityAuditReport,
    alertLevel: SecuritySeverity,
  ): Promise<void> {
    const alertData = {
      audit_id: report.audit_id,
      guild_name: report.guild_name,
      security_score: report.overall_score,
      critical_vulns: report.vulnerabilities.filter(
        (v) => v.severity === SecuritySeverity.CRITICAL,
      ).length,
      high_vulns: report.vulnerabilities.filter(
        (v) => v.severity === SecuritySeverity.HIGH,
      ).length,
      alert_level: alertLevel,
      timestamp: new Date().toISOString(),
    };

    // Emit alert event
    this.emit("security_alert", alertData);

    // Send to notification channel if configured
    if (this.config.notification_channel_id && this.client) {
      try {
        const channel = (await this.client.channels.fetch(
          this.config.notification_channel_id,
        )) as TextChannel;
        if (channel) {
          const embed = {
            title: `🚨 Security Alert - ${alertLevel.toUpperCase()}`,
            description: `Security audit detected vulnerabilities in **${report.guild_name}**`,
            color:
              alertLevel === SecuritySeverity.CRITICAL ? 0xff0000 : 0xff6600,
            fields: [
              {
                name: "Security Score",
                value: `${report.overall_score}/100`,
                inline: true,
              },
              {
                name: "Critical Issues",
                value: alertData.critical_vulns.toString(),
                inline: true,
              },
              {
                name: "High Issues",
                value: alertData.high_vulns.toString(),
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          };

          await channel.send({ embeds: [embed] });
        }
      } catch (err) {
        error(`Failed to send security alert to channel: ${err}`);
      }
    }

    // Send to webhook if configured
    if (this.config.webhook_alerts_url) {
      try {
        await fetch(this.config.webhook_alerts_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alertData),
        });
      } catch (err) {
        error(`Failed to send security alert to webhook: ${err}`);
      }
    }
  }

  /**
   * Get severity weight for sorting
   */
  private severityWeight(severity: SecuritySeverity): number {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return 5;
      case SecuritySeverity.HIGH:
        return 4;
      case SecuritySeverity.MEDIUM:
        return 3;
      case SecuritySeverity.LOW:
        return 2;
      case SecuritySeverity.INFO:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Get audit report
   */
  getAuditReport(
    guildId: string,
    auditId?: string,
  ): SecurityAuditReport | null {
    const history = this.auditHistory.get(guildId) || [];

    if (auditId) {
      return history.find((report) => report.audit_id === auditId) || null;
    }

    return history[0] || null; // Most recent
  }

  /**
   * Assess compliance with security standards
   */
  private assessCompliance(
    _guild: Guild,
    vulnerabilities: SecurityVulnerability[],
  ): Record<
    ComplianceStandard,
    {
      compliant: boolean;
      score: number;
      missing_requirements: string[];
    }
  > {
    const result = {} as Record<
      ComplianceStandard,
      {
        compliant: boolean;
        score: number;
        missing_requirements: string[];
      }
    >;

    for (const standard of this.config.compliance_standards) {
      const relevantVulns = vulnerabilities.filter((v) =>
        v.compliance_impact?.includes(standard),
      );

      const criticalVulns = relevantVulns.filter(
        (v) => v.severity === SecuritySeverity.CRITICAL,
      ).length;
      const highVulns = relevantVulns.filter(
        (v) => v.severity === SecuritySeverity.HIGH,
      ).length;

      const compliant = criticalVulns === 0 && highVulns <= 2;
      const score = Math.max(
        0,
        100 - criticalVulns * 40 - highVulns * 20 - relevantVulns.length * 5,
      );

      result[standard] = {
        compliant,
        score,
        missing_requirements: relevantVulns.map((v) => v.title),
      };
    }

    return result;
  }

  /**
   * Mark vulnerability as false positive
   */
  markFalsePositive(guildId: string, vulnerabilityId: string): boolean {
    const history = this.auditHistory.get(guildId) || [];

    for (const report of history) {
      const vuln = report.vulnerabilities.find((v) => v.id === vulnerabilityId);
      if (vuln) {
        vuln.false_positive = true;
        info(`Marked vulnerability ${vulnerabilityId} as false positive`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard(): {
    total_guilds_audited: number;
    average_security_score: number;
    total_vulnerabilities: number;
    vulnerabilities_by_severity: Record<SecuritySeverity, number>;
    compliance_overview: Record<ComplianceStandard, number>;
    recent_audits: Array<{
      guild_name: string;
      audit_date: Date;
      security_score: number;
      vulnerability_count: number;
    }>;
  } {
    const allReports = Array.from(this.auditHistory.values()).flat();
    const recentReports = allReports.slice(0, 10);

    const totalVulns = allReports.reduce(
      (sum, report) => sum + report.vulnerabilities.length,
      0,
    );
    const avgScore =
      allReports.length > 0
        ? allReports.reduce((sum, report) => sum + report.overall_score, 0) /
          allReports.length
        : 0;

    const vulnsBySeverity: Record<SecuritySeverity, number> = {
      [SecuritySeverity.CRITICAL]: 0,
      [SecuritySeverity.HIGH]: 0,
      [SecuritySeverity.MEDIUM]: 0,
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.INFO]: 0,
    };

    for (const report of allReports) {
      for (const vuln of report.vulnerabilities) {
        vulnsBySeverity[vuln.severity]++;
      }
    }

    return {
      total_guilds_audited: this.auditHistory.size,
      average_security_score: Math.round(avgScore),
      total_vulnerabilities: totalVulns,
      vulnerabilities_by_severity: vulnsBySeverity,
      compliance_overview: {}, // Would calculate compliance stats
      recent_audits: recentReports.map((report) => ({
        guild_name: report.guild_name,
        audit_date: report.audit_date,
        security_score: report.overall_score,
        vulnerability_count: report.vulnerabilities.length,
      })),
    };
  }

  /**
   * Shutdown the security audit service
   */
  shutdown(): void {
    // Cancel all scheduled audits
    for (const interval of this.scheduledAudits.values()) {
      clearInterval(interval);
    }

    this.scheduledAudits.clear();
    this.auditHistory.clear();

    info("Security audit service shutdown complete");
  }
}
