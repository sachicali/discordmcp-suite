/**
 * @fileoverview Advanced Security Service with Audit Logging
 * @description Implements comprehensive security features including permission validation,
 * audit logging, IP whitelisting, and security event monitoring
 */

import { EventEmitter } from "events";
import { Client, PermissionsBitField } from "discord.js";
import { info, error } from "../logger.js";
import fs from "fs/promises";
import path from "path";

/**
 * Security event types
 */
export enum SecurityEventType {
  PERMISSION_DENIED = "permission_denied",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  ADMIN_ACTION = "admin_action",
  SECURITY_VIOLATION = "security_violation",
  IP_WHITELIST_VIOLATION = "ip_whitelist_violation",
}

/**
 * Audit log entry interface
 */
interface AuditLogEntry {
  id: string;
  timestamp: number;
  eventType: SecurityEventType;
  userId?: string;
  guildId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
}

/**
 * Permission check result
 */
interface PermissionCheckResult {
  allowed: boolean;
  missingPermissions: string[];
  reason?: string;
}

/**
 * Security configuration
 */
interface SecurityConfig {
  enableAuditLogging: boolean;
  auditLogPath: string;
  maxAuditLogSize: number; // in MB
  ipWhitelist: string[];
  enableIpWhitelisting: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  adminUserIds: string[];
  trustedRoleIds: string[];
  monitoringEnabled: boolean;
}

/**
 * Failed attempt tracking
 */
interface FailedAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

/**
 * Advanced Security Service for Discord MCP Server
 */
export class SecurityService extends EventEmitter {
  private config: SecurityConfig;
  private auditLogs: AuditLogEntry[] = [];
  private failedAttempts: Map<string, FailedAttempt> = new Map();
  private trustedIPs: Set<string> = new Set();
  private suspiciousActivity: Map<string, number> = new Map();
  private logRotationInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<SecurityConfig> = {}) {
    super();

    this.config = {
      enableAuditLogging: true,
      auditLogPath: "./logs/audit.log",
      maxAuditLogSize: 100, // 100MB
      ipWhitelist: [],
      enableIpWhitelisting: false,
      maxFailedAttempts: 5,
      lockoutDuration: 30, // 30 minutes
      adminUserIds: [],
      trustedRoleIds: [],
      monitoringEnabled: true,
      ...config,
    };

    this.trustedIPs = new Set(this.config.ipWhitelist);
    this.startLogRotation();
    this.startMonitoring();
  }

  /**
   * Validate user permissions for a specific action
   */
  async validatePermissions(
    client: Client,
    userId: string,
    guildId: string,
    requiredPermissions: bigint[],
    action: string,
    context?: Record<string, any>,
  ): Promise<PermissionCheckResult> {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          guildId,
          action,
          reason: "Guild not found",
          context,
        });

        return {
          allowed: false,
          missingPermissions: [],
          reason: "Guild not accessible",
        };
      }

      const member = guild.members.cache.get(userId);
      if (!member) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          guildId,
          action,
          reason: "Member not found in guild",
          context,
        });

        return {
          allowed: false,
          missingPermissions: [],
          reason: "User not found in server",
        };
      }

      // Check if user is admin
      if (this.config.adminUserIds.includes(userId)) {
        await this.logSecurityEvent(
          SecurityEventType.ADMIN_ACTION,
          {
            userId,
            guildId,
            action,
            reason: "Admin override",
            context,
          },
          "low",
        );

        return { allowed: true, missingPermissions: [] };
      }

      // Check if user has trusted role
      const hasTrustedRole = member.roles.cache.some((role) =>
        this.config.trustedRoleIds.includes(role.id),
      );

      if (hasTrustedRole && requiredPermissions.length === 0) {
        return { allowed: true, missingPermissions: [] };
      }

      // Check specific permissions
      const missingPermissions: string[] = [];
      const memberPermissions = member.permissions;

      for (const permission of requiredPermissions) {
        if (!memberPermissions.has(permission)) {
          const permissionName = this.getPermissionName(permission);
          missingPermissions.push(permissionName);
        }
      }

      const allowed = missingPermissions.length === 0;

      if (!allowed) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          guildId,
          action,
          missingPermissions,
          userPermissions: memberPermissions.toArray(),
          context,
        });
      }

      return { allowed, missingPermissions };
    } catch (err) {
      await this.logSecurityEvent(
        SecurityEventType.SECURITY_VIOLATION,
        {
          userId,
          guildId,
          action,
          error: err instanceof Error ? err.message : String(err),
          context,
        },
        "high",
      );

      return {
        allowed: false,
        missingPermissions: [],
        reason: "Permission validation failed",
      };
    }
  }

  /**
   * Check if IP address is whitelisted
   */
  async checkIPWhitelist(
    ipAddress: string,
    userId?: string,
    action?: string,
  ): Promise<boolean> {
    if (!this.config.enableIpWhitelisting) {
      return true;
    }

    const isWhitelisted =
      this.trustedIPs.has(ipAddress) ||
      this.trustedIPs.has("*") ||
      ipAddress === "127.0.0.1" ||
      ipAddress === "::1";

    if (!isWhitelisted) {
      await this.logSecurityEvent(
        SecurityEventType.IP_WHITELIST_VIOLATION,
        {
          ipAddress,
          userId,
          action,
          whitelistedIPs: Array.from(this.trustedIPs),
        },
        "medium",
      );

      this.trackFailedAttempt(ipAddress);
    }

    return isWhitelisted;
  }

  /**
   * Track failed access attempts
   */
  private trackFailedAttempt(identifier: string): void {
    const now = Date.now();
    const existing = this.failedAttempts.get(identifier);

    if (existing) {
      existing.count++;
      existing.lastAttempt = now;

      // Check if should be locked out
      if (existing.count >= this.config.maxFailedAttempts) {
        existing.lockedUntil = now + this.config.lockoutDuration * 60 * 1000;

        this.logSecurityEvent(
          SecurityEventType.SECURITY_VIOLATION,
          {
            identifier,
            failedAttempts: existing.count,
            lockedUntil: existing.lockedUntil,
          },
          "high",
        );
      }
    } else {
      this.failedAttempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
    }
  }

  /**
   * Check if identifier is currently locked out
   */
  isLockedOut(identifier: string): boolean {
    const attempt = this.failedAttempts.get(identifier);
    if (!attempt?.lockedUntil) {
      return false;
    }

    if (Date.now() > attempt.lockedUntil) {
      // Lockout expired, reset
      this.failedAttempts.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, any>,
    severity: "low" | "medium" | "high" | "critical" = "medium",
    userId?: string,
    guildId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: Date.now(),
      eventType,
      userId: userId || details.userId,
      guildId: guildId || details.guildId,
      action: details.action || eventType,
      details,
      ipAddress,
      userAgent,
      severity,
      resolved: false,
    };

    this.auditLogs.push(entry);

    // Emit event for real-time monitoring
    this.emit("securityEvent", entry);

    // Log to file if enabled
    if (this.config.enableAuditLogging) {
      await this.writeAuditLog(entry);
    }

    // Trigger alerts for high severity events
    if (severity === "high" || severity === "critical") {
      this.emit("securityAlert", entry);
    }

    info(
      `Security Event [${severity.toUpperCase()}]: ${eventType} - ${JSON.stringify(details)}`,
    );
  }

  /**
   * Write audit log to file
   */
  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const logDir = path.dirname(this.config.auditLogPath);
      await fs.mkdir(logDir, { recursive: true });

      const logLine =
        JSON.stringify({
          ...entry,
          timestamp: new Date(entry.timestamp).toISOString(),
        }) + "\n";

      await fs.appendFile(this.config.auditLogPath, logLine);
    } catch (err) {
      error(`Failed to write audit log: ${err}`);
    }
  }

  /**
   * Get audit logs with filtering
   */
  getAuditLogs(filter?: {
    eventType?: SecurityEventType;
    userId?: string;
    guildId?: string;
    severity?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = [...this.auditLogs];

    if (filter) {
      if (filter.eventType) {
        logs = logs.filter((log) => log.eventType === filter.eventType);
      }
      if (filter.userId) {
        logs = logs.filter((log) => log.userId === filter.userId);
      }
      if (filter.guildId) {
        logs = logs.filter((log) => log.guildId === filter.guildId);
      }
      if (filter.severity) {
        logs = logs.filter((log) => log.severity === filter.severity);
      }
      if (filter.startTime) {
        logs = logs.filter((log) => log.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        logs = logs.filter((log) => log.timestamp <= filter.endTime!);
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }

  /**
   * Get permission name from bitfield value
   */
  private getPermissionName(permission: bigint): string {
    const permissionMap: Map<bigint, string> = new Map([
      [PermissionsBitField.Flags.Administrator, "Administrator"],
      [PermissionsBitField.Flags.ManageChannels, "Manage Channels"],
      [PermissionsBitField.Flags.ManageGuild, "Manage Server"],
      [PermissionsBitField.Flags.ManageMessages, "Manage Messages"],
      [PermissionsBitField.Flags.ManageRoles, "Manage Roles"],
      [PermissionsBitField.Flags.ManageWebhooks, "Manage Webhooks"],
      [PermissionsBitField.Flags.KickMembers, "Kick Members"],
      [PermissionsBitField.Flags.BanMembers, "Ban Members"],
      [PermissionsBitField.Flags.ModerateMembers, "Timeout Members"],
      [PermissionsBitField.Flags.SendMessages, "Send Messages"],
      [PermissionsBitField.Flags.ViewChannel, "View Channel"],
      [PermissionsBitField.Flags.ReadMessageHistory, "Read Message History"],
    ]);

    return (
      permissionMap.get(permission) || `Unknown Permission (${permission})`
    );
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start log rotation
   */
  private startLogRotation(): void {
    this.logRotationInterval = setInterval(async () => {
      await this.rotateAuditLogs();
    }, 60000); // Check every minute
  }

  /**
   * Rotate audit logs if they exceed size limit
   */
  private async rotateAuditLogs(): Promise<void> {
    try {
      const stats = await fs.stat(this.config.auditLogPath).catch(() => null);
      if (!stats) return;

      const sizeInMB = stats.size / (1024 * 1024);

      if (sizeInMB > this.config.maxAuditLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotatedPath = `${this.config.auditLogPath}.${timestamp}`;

        await fs.rename(this.config.auditLogPath, rotatedPath);
        info(`Rotated audit log to ${rotatedPath}`);

        // Clean up old audit logs in memory (keep last 1000 entries)
        if (this.auditLogs.length > 1000) {
          this.auditLogs = this.auditLogs.slice(-1000);
        }
      }
    } catch (err) {
      error(`Failed to rotate audit logs: ${err}`);
    }
  }

  /**
   * Start monitoring for suspicious activity
   */
  private startMonitoring(): void {
    if (!this.config.monitoringEnabled) return;

    setInterval(() => {
      this.analyzeSuspiciousActivity();
    }, 300000); // Analyze every 5 minutes
  }

  /**
   * Analyze patterns for suspicious activity
   */
  private analyzeSuspiciousActivity(): void {
    const now = Date.now();
    const recentLogs = this.auditLogs.filter(
      (log) => now - log.timestamp < 300000, // Last 5 minutes
    );

    // Check for rapid permission denials
    const permissionDenials = recentLogs.filter(
      (log) => log.eventType === SecurityEventType.PERMISSION_DENIED,
    );

    const userDenials = new Map<string, number>();
    permissionDenials.forEach((log) => {
      if (log.userId) {
        userDenials.set(log.userId, (userDenials.get(log.userId) || 0) + 1);
      }
    });

    // Alert on users with excessive permission denials
    userDenials.forEach((count, userId) => {
      if (count > 10) {
        // More than 10 denials in 5 minutes
        this.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          {
            userId,
            pattern: "excessive_permission_denials",
            count,
            timeWindow: "5 minutes",
          },
          "high",
        );
      }
    });
  }

  /**
   * Add IP to whitelist
   */
  addToIPWhitelist(ipAddress: string): void {
    this.trustedIPs.add(ipAddress);
    info(`Added ${ipAddress} to IP whitelist`);
  }

  /**
   * Remove IP from whitelist
   */
  removeFromIPWhitelist(ipAddress: string): void {
    this.trustedIPs.delete(ipAddress);
    info(`Removed ${ipAddress} from IP whitelist`);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recent24h = this.auditLogs.filter((log) => log.timestamp > last24h);

    return {
      totalAuditLogs: this.auditLogs.length,
      last24Hours: {
        total: recent24h.length,
        byEventType: recent24h.reduce(
          (acc, log) => {
            acc[log.eventType] = (acc[log.eventType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        bySeverity: recent24h.reduce(
          (acc, log) => {
            acc[log.severity] = (acc[log.severity] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      failedAttempts: this.failedAttempts.size,
      activeWatches: this.suspiciousActivity.size,
      whitelistedIPs: this.trustedIPs.size,
    };
  }

  /**
   * Shutdown security service
   */
  shutdown(): void {
    if (this.logRotationInterval) {
      clearInterval(this.logRotationInterval);
      this.logRotationInterval = null;
    }

    info("Security service shutdown complete");
  }
}
