/**
 * @fileoverview Enterprise Integration Service
 * @description Integrates all advanced services and provides unified management
 * for rate limiting, security, monitoring, error handling, advanced features, and developer tools
 */

import { EventEmitter } from "events";
import { Client } from "discord.js";
import { info, error } from "../logger.js";

// Import all services
import { DiscordRateLimiter } from "./rateLimiter.js";
import { SecurityService, SecurityEventType } from "./securityService.js";
import { MonitoringService, MetricType } from "./monitoringService.js";
import { ErrorHandlingService } from "./errorHandlingService.js";
import {
  AdvancedFeaturesService,
  AutoModerationRuleType,
  AutoModerationAction,
} from "./advancedFeaturesService.js";
import { DeveloperService } from "./developerService.js";

/**
 * Enterprise configuration
 */
interface EnterpriseConfig {
  // Global settings
  enableAllFeatures: boolean;
  productionMode: boolean;

  // Service specific settings
  rateLimiting: {
    enabled: boolean;
    maxConcurrentRequests: number;
    maxQueueSize: number;
  };

  security: {
    enabled: boolean;
    auditLogging: boolean;
    ipWhitelisting: boolean;
    adminUserIds: string[];
  };

  monitoring: {
    enabled: boolean;
    metricsRetention: number;
    healthCheckInterval: number;
  };

  errorHandling: {
    enabled: boolean;
    enableRetry: boolean;
    enableCircuitBreaker: boolean;
  };

  advancedFeatures: {
    enabled: boolean;
    autoModeration: boolean;
    messageAnalytics: boolean;
    scheduledEvents: boolean;
  };

  developer: {
    enabled: boolean;
    generateDocs: boolean;
    interactiveTesting: boolean;
    devMode: boolean;
  };
}

/**
 * Service health status
 */
interface ServiceHealth {
  service: string;
  status: "healthy" | "warning" | "critical" | "offline";
  lastCheck: number;
  metrics?: Record<string, any>;
  errors?: string[];
}

/**
 * Enterprise Discord MCP Integration Service
 */
export class EnterpriseIntegrationService extends EventEmitter {
  private config: EnterpriseConfig;
  private services: {
    rateLimiter?: DiscordRateLimiter;
    security?: SecurityService;
    monitoring?: MonitoringService;
    errorHandling?: ErrorHandlingService;
    advancedFeatures?: AdvancedFeaturesService;
    developer?: DeveloperService;
  } = {};

  private healthStatus: Map<string, ServiceHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: Partial<EnterpriseConfig> = {}) {
    super();

    this.config = {
      enableAllFeatures: process.env.NODE_ENV !== "production",
      productionMode: process.env.NODE_ENV === "production",

      rateLimiting: {
        enabled: true,
        maxConcurrentRequests: 50,
        maxQueueSize: 1000,
      },

      security: {
        enabled: true,
        auditLogging: true,
        ipWhitelisting: false,
        adminUserIds: [],
      },

      monitoring: {
        enabled: true,
        metricsRetention: 7,
        healthCheckInterval: 30,
      },

      errorHandling: {
        enabled: true,
        enableRetry: true,
        enableCircuitBreaker: true,
      },

      advancedFeatures: {
        enabled: true,
        autoModeration: true,
        messageAnalytics: true,
        scheduledEvents: true,
      },

      developer: {
        enabled:
          !process.env.NODE_ENV || process.env.NODE_ENV === "development",
        generateDocs: true,
        interactiveTesting: true,
        devMode: process.env.NODE_ENV === "development",
      },

      ...config,
    };
  }

  /**
   * Initialize all enterprise services
   */
  async initialize(client: Client): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      info("Initializing Enterprise Integration Service...");

      // Initialize Rate Limiter
      if (this.config.rateLimiting.enabled || this.config.enableAllFeatures) {
        this.services.rateLimiter = new DiscordRateLimiter({
          maxConcurrentRequests: this.config.rateLimiting.maxConcurrentRequests,
          maxQueueSize: this.config.rateLimiting.maxQueueSize,
        });

        this.setupRateLimiterEvents();
        info("✓ Rate Limiter initialized");
      }

      // Initialize Security Service
      if (this.config.security.enabled || this.config.enableAllFeatures) {
        this.services.security = new SecurityService({
          enableAuditLogging: this.config.security.auditLogging,
          enableIpWhitelisting: this.config.security.ipWhitelisting,
          adminUserIds: this.config.security.adminUserIds,
        });

        this.setupSecurityEvents();
        info("✓ Security Service initialized");
      }

      // Initialize Monitoring Service
      if (this.config.monitoring.enabled || this.config.enableAllFeatures) {
        this.services.monitoring = new MonitoringService({
          metricsRetention: this.config.monitoring.metricsRetention,
          healthCheckInterval: this.config.monitoring.healthCheckInterval,
        });

        this.setupMonitoringEvents();
        info("✓ Monitoring Service initialized");
      }

      // Initialize Error Handling Service
      if (this.config.errorHandling.enabled || this.config.enableAllFeatures) {
        this.services.errorHandling = new ErrorHandlingService({
          enableRetry: this.config.errorHandling.enableRetry,
          enableCircuitBreaker: this.config.errorHandling.enableCircuitBreaker,
        });

        this.setupErrorHandlingEvents();
        info("✓ Error Handling Service initialized");
      }

      // Initialize Advanced Features Service
      if (
        this.config.advancedFeatures.enabled ||
        this.config.enableAllFeatures
      ) {
        this.services.advancedFeatures = new AdvancedFeaturesService({
          enableAutoModeration: this.config.advancedFeatures.autoModeration,
          enableMessageAnalytics: this.config.advancedFeatures.messageAnalytics,
          enableScheduledEvents: this.config.advancedFeatures.scheduledEvents,
        });

        this.setupAdvancedFeaturesEvents(client);
        info("✓ Advanced Features Service initialized");
      }

      // Initialize Developer Service
      if (this.config.developer.enabled || this.config.enableAllFeatures) {
        this.services.developer = new DeveloperService({
          enableDocumentation: this.config.developer.generateDocs,
          enableInteractiveTesting: this.config.developer.interactiveTesting,
          devMode: {
            enabled: this.config.developer.devMode,
            logLevel: this.config.productionMode ? "info" : "debug",
            enableRequestLogging: !this.config.productionMode,
            enablePerformanceMetrics: true,
            enableStackTraces: !this.config.productionMode,
            mockResponses: false,
          },
        });

        this.setupDeveloperEvents();
        info("✓ Developer Service initialized");
      }

      // Start health monitoring
      this.startHealthMonitoring(client);

      // Setup cross-service integrations
      this.setupServiceIntegrations();

      this.isInitialized = true;
      this.emit("initialized");

      info("✅ Enterprise Integration Service fully initialized");
    } catch (err) {
      error(`Failed to initialize Enterprise Integration Service: ${err}`);
      throw err;
    }
  }

  /**
   * Execute tool with full enterprise features
   */
  async executeToolWithEnterpriseFeatures<T>(
    toolName: string,
    parameters: Record<string, any>,
    context: {
      userId?: string;
      guildId?: string;
      channelId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
    toolExecutor: () => Promise<T>,
  ): Promise<T> {
    const operationId = `${toolName}_${Date.now()}`;

    try {
      // Start monitoring
      if (this.services.monitoring) {
        this.services.monitoring.startTimer(operationId);
        this.services.monitoring.recordToolUsage(
          toolName,
          context.userId,
          context.guildId,
          true,
        );
      }

      // Security validation
      if (this.services.security && context.userId && context.guildId) {
        // This would include permission validation based on the tool requirements
        // For now, we'll just log the access
        await this.services.security.logSecurityEvent(
          SecurityEventType.ADMIN_ACTION,
          {
            action: toolName,
            parameters: Object.keys(parameters),
            context,
          },
          "low",
          context.userId,
          context.guildId,
          context.ipAddress,
          context.userAgent,
        );
      }

      // IP whitelist check
      if (this.services.security && context.ipAddress) {
        const isAllowed = await this.services.security.checkIPWhitelist(
          context.ipAddress,
          context.userId,
          toolName,
        );

        if (!isAllowed) {
          throw new Error("IP address not whitelisted");
        }
      }

      // Rate limiting with error handling
      let result: T;

      if (this.services.rateLimiter && this.services.errorHandling) {
        result = await this.services.rateLimiter.queueRequest(
          toolName,
          "POST",
          async () => {
            return await this.services.errorHandling!.executeWithErrorHandling(
              operationId,
              toolExecutor,
              context,
            );
          },
          "medium",
          parameters,
        );
      } else if (this.services.rateLimiter) {
        result = await this.services.rateLimiter.queueRequest(
          toolName,
          "POST",
          toolExecutor,
          "medium",
          parameters,
        );
      } else if (this.services.errorHandling) {
        result = await this.services.errorHandling.executeWithErrorHandling(
          operationId,
          toolExecutor,
          context,
        );
      } else {
        result = await toolExecutor();
      }

      // Record success metrics
      if (this.services.monitoring) {
        this.services.monitoring.endTimer(operationId);
        this.services.monitoring.recordMetric(
          `${toolName}_success`,
          MetricType.COUNTER,
          1,
          { tool: toolName },
        );
      }

      return result;
    } catch (err) {
      // Record failure metrics
      if (this.services.monitoring) {
        this.services.monitoring.endTimer(operationId);
        this.services.monitoring.recordToolUsage(
          toolName,
          context.userId,
          context.guildId,
          false,
        );
        this.services.monitoring.recordMetric(
          `${toolName}_error`,
          MetricType.COUNTER,
          1,
          {
            tool: toolName,
            error: err instanceof Error ? err.name : "Unknown",
          },
        );
      }

      // Security logging for failures
      if (this.services.security) {
        await this.services.security.logSecurityEvent(
          SecurityEventType.SECURITY_VIOLATION,
          {
            action: toolName,
            error: err instanceof Error ? err.message : String(err),
            context,
          },
          "medium",
          context.userId,
          context.guildId,
          context.ipAddress,
          context.userAgent,
        );
      }

      throw err;
    }
  }

  /**
   * Setup rate limiter event handlers
   */
  private setupRateLimiterEvents(): void {
    if (!this.services.rateLimiter) return;

    this.services.rateLimiter.on("requestQueued", () => {
      if (this.services.monitoring) {
        this.services.monitoring.recordMetric(
          "rate_limit_queue_size",
          MetricType.GAUGE,
          1,
        );
      }
    });

    this.services.rateLimiter.on("globalRateLimit", (data) => {
      if (this.services.monitoring) {
        this.services.monitoring.recordMetric(
          "global_rate_limit_hit",
          MetricType.COUNTER,
          1,
        );
      }
      info(`Global rate limit hit, reset in ${data.resetAfter}s`);
    });

    this.services.rateLimiter.on("highMemoryUsage", (data) => {
      error(
        `High memory usage detected: ${data.usage}MB (threshold: ${data.threshold}MB)`,
      );
    });
  }

  /**
   * Setup security event handlers
   */
  private setupSecurityEvents(): void {
    if (!this.services.security) return;

    this.services.security.on("securityAlert", (alert) => {
      error(
        `Security Alert [${alert.severity}]: ${alert.eventType} - ${JSON.stringify(alert.details)}`,
      );

      if (this.services.monitoring) {
        this.services.monitoring.recordMetric(
          "security_alert",
          MetricType.COUNTER,
          1,
          { severity: alert.severity, type: alert.eventType },
        );
      }
    });

    this.services.security.on("securityEvent", (event) => {
      if (this.services.monitoring && event.severity === "critical") {
        this.services.monitoring.recordMetric(
          "critical_security_event",
          MetricType.COUNTER,
          1,
        );
      }
    });
  }

  /**
   * Setup monitoring event handlers
   */
  private setupMonitoringEvents(): void {
    if (!this.services.monitoring) return;

    this.services.monitoring.on("alert", (alert) => {
      error(`Monitoring Alert [${alert.severity}]: ${alert.message}`);

      // Could integrate with external alerting systems here
      this.emit("monitoringAlert", alert);
    });
  }

  /**
   * Setup error handling event handlers
   */
  private setupErrorHandlingEvents(): void {
    if (!this.services.errorHandling) return;

    this.services.errorHandling.on("operationFailed", (data) => {
      if (this.services.monitoring) {
        this.services.monitoring.recordMetric(
          "operation_failure",
          MetricType.COUNTER,
          1,
          { operation: data.operationName },
        );
      }
    });

    this.services.errorHandling.on("circuitBreakerOpened", (data) => {
      error(`Circuit breaker opened for ${data.operationName}`);

      if (this.services.monitoring) {
        this.services.monitoring.recordMetric(
          "circuit_breaker_opened",
          MetricType.COUNTER,
          1,
        );
      }
    });
  }

  /**
   * Setup advanced features event handlers
   */
  private setupAdvancedFeaturesEvents(client: Client): void {
    if (!this.services.advancedFeatures) return;

    // Listen for Discord messages to process through auto-moderation
    client.on("messageCreate", async (message) => {
      if (this.services.advancedFeatures) {
        await this.services.advancedFeatures.processMessage(message);
      }
    });

    this.services.advancedFeatures.on("moderationIncident", (incident) => {
      if (this.services.security) {
        this.services.security.logSecurityEvent(
          SecurityEventType.SECURITY_VIOLATION,
          {
            autoModeration: true,
            ...incident,
          },
          "medium",
        );
      }
    });

    this.services.advancedFeatures.on("scheduledEventCreated", (data) => {
      info(
        `Scheduled event created: ${data.event.name} in guild ${data.guildId}`,
      );
    });
  }

  /**
   * Setup developer service event handlers
   */
  private setupDeveloperEvents(): void {
    if (!this.services.developer) return;

    this.services.developer.on("testCaseCompleted", (result) => {
      if (this.services.monitoring) {
        this.services.monitoring.recordMetric(
          "test_case_result",
          MetricType.COUNTER,
          1,
          { success: result.success.toString() },
        );
      }
    });
  }

  /**
   * Setup cross-service integrations
   */
  private setupServiceIntegrations(): void {
    // Rate limiter metrics to monitoring
    if (this.services.rateLimiter && this.services.monitoring) {
      setInterval(() => {
        const metrics = this.services.rateLimiter!.getMetrics();
        this.services.monitoring!.recordMetric(
          "rate_limiter_queue_size",
          MetricType.GAUGE,
          metrics.queueSize,
        );
        this.services.monitoring!.recordMetric(
          "rate_limiter_active_requests",
          MetricType.GAUGE,
          metrics.activeRequests,
        );
      }, 30000); // Every 30 seconds
    }

    // Security events to monitoring
    if (this.services.security && this.services.monitoring) {
      this.services.security.on("securityEvent", (event) => {
        this.services.monitoring!.recordMetric(
          "security_events",
          MetricType.COUNTER,
          1,
          { type: event.eventType, severity: event.severity },
        );
      });
    }

    info("Cross-service integrations configured");
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(client: Client): void {
    const checkInterval = this.config.monitoring.healthCheckInterval * 1000;

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks(client);
    }, checkInterval);

    info(
      `Health monitoring started with ${this.config.monitoring.healthCheckInterval}s interval`,
    );
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks(
    client: Client,
  ): Promise<Map<string, ServiceHealth>> {
    const healthResults = new Map<string, ServiceHealth>();

    // Check monitoring service
    if (this.services.monitoring) {
      try {
        await this.services.monitoring.performHealthChecks(client);
        const systemMetrics = this.services.monitoring.getSystemMetrics();

        healthResults.set("monitoring", {
          service: "monitoring",
          status: "healthy",
          lastCheck: Date.now(),
          metrics: systemMetrics,
        });
      } catch (err) {
        healthResults.set("monitoring", {
          service: "monitoring",
          status: "critical",
          lastCheck: Date.now(),
          errors: [err instanceof Error ? err.message : String(err)],
        });
      }
    }

    // Check rate limiter
    if (this.services.rateLimiter) {
      const metrics = this.services.rateLimiter.getMetrics();
      const status = metrics.queueSize > 500 ? "warning" : "healthy";

      healthResults.set("rateLimiter", {
        service: "rateLimiter",
        status,
        lastCheck: Date.now(),
        metrics,
      });
    }

    // Check security service
    if (this.services.security) {
      const securityMetrics = this.services.security.getSecurityMetrics();
      const criticalEvents =
        securityMetrics.last24Hours.bySeverity.critical || 0;
      const status =
        criticalEvents > 10
          ? "critical"
          : criticalEvents > 0
            ? "warning"
            : "healthy";

      healthResults.set("security", {
        service: "security",
        status,
        lastCheck: Date.now(),
        metrics: securityMetrics,
      });
    }

    // Check error handling service
    if (this.services.errorHandling) {
      const errorStats = this.services.errorHandling.getErrorStatistics();
      const recentErrors = errorStats.recentErrors;
      const status =
        recentErrors > 50
          ? "critical"
          : recentErrors > 10
            ? "warning"
            : "healthy";

      healthResults.set("errorHandling", {
        service: "errorHandling",
        status,
        lastCheck: Date.now(),
        metrics: errorStats,
      });
    }

    // Update health status
    healthResults.forEach((health, service) => {
      this.healthStatus.set(service, health);
    });

    // Emit health check completed event
    this.emit("healthCheckCompleted", healthResults);

    return healthResults;
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    overall: "healthy" | "warning" | "critical";
    services: Record<string, ServiceHealth>;
    summary: {
      totalServices: number;
      healthyServices: number;
      warningServices: number;
      criticalServices: number;
    };
  } {
    const services: Record<string, ServiceHealth> = {};
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    for (const [service, health] of this.healthStatus.entries()) {
      services[service] = health;

      switch (health.status) {
        case "healthy":
          healthyCount++;
          break;
        case "warning":
          warningCount++;
          break;
        case "critical":
          criticalCount++;
          break;
      }
    }

    const totalServices = this.healthStatus.size;
    let overall: "healthy" | "warning" | "critical" = "healthy";

    if (criticalCount > 0) {
      overall = "critical";
    } else if (warningCount > 0) {
      overall = "warning";
    }

    return {
      overall,
      services,
      summary: {
        totalServices,
        healthyServices: healthyCount,
        warningServices: warningCount,
        criticalServices: criticalCount,
      },
    };
  }

  /**
   * Add auto-moderation rule
   */
  addAutoModerationRule(rule: {
    name: string;
    type: AutoModerationRuleType;
    conditions: Record<string, any>;
    actions: AutoModerationAction[];
    exemptRoles?: string[];
    exemptChannels?: string[];
  }): string | null {
    if (!this.services.advancedFeatures) {
      return null;
    }

    return this.services.advancedFeatures.addAutoModerationRule({
      ...rule,
      enabled: true,
      exemptRoles: rule.exemptRoles || [],
      exemptChannels: rule.exemptChannels || [],
    });
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics(): {
    performance: any;
    security: any;
    usage: any;
    errors: any;
    moderation: any;
  } {
    return {
      performance: this.services.monitoring?.getSystemMetrics() || null,
      security: this.services.security?.getSecurityMetrics() || null,
      usage: this.services.advancedFeatures?.getMessageAnalytics() || null,
      errors: this.services.errorHandling?.getErrorStatistics() || null,
      moderation:
        this.services.advancedFeatures?.getAutoModerationStats() || null,
    };
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    info("Shutting down Enterprise Integration Service...");

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Shutdown all services
    const shutdownPromises = [];

    if (this.services.rateLimiter) {
      shutdownPromises.push(
        Promise.resolve(this.services.rateLimiter.shutdown()),
      );
    }

    if (this.services.security) {
      shutdownPromises.push(Promise.resolve(this.services.security.shutdown()));
    }

    if (this.services.monitoring) {
      shutdownPromises.push(
        Promise.resolve(this.services.monitoring.shutdown()),
      );
    }

    if (this.services.errorHandling) {
      shutdownPromises.push(
        Promise.resolve(this.services.errorHandling.shutdown()),
      );
    }

    if (this.services.advancedFeatures) {
      shutdownPromises.push(
        Promise.resolve(this.services.advancedFeatures.shutdown()),
      );
    }

    if (this.services.developer) {
      shutdownPromises.push(
        Promise.resolve(this.services.developer.shutdown()),
      );
    }

    await Promise.all(shutdownPromises);

    this.services = {};
    this.healthStatus.clear();
    this.isInitialized = false;

    info("✅ Enterprise Integration Service shutdown complete");
  }
}
