/**
 * @fileoverview Health Monitoring and Metrics Service
 * @description Comprehensive health monitoring, metrics collection, and alerting
 * for the MCP Discord Server. Provides real-time health status, performance metrics,
 * and automated alerting for production deployments.
 *
 * Features:
 * - Real-time health checks for Discord API and internal services
 * - Performance metrics collection (latency, throughput, error rates)
 * - Resource monitoring (memory, CPU, connections)
 * - Automated alerting and notification system
 * - Circuit breaker status monitoring
 * - Historical metrics storage and analysis
 *
 * @author MCP Discord Team
 * @version 1.0.0
 * @since 1.4.0
 */

import { EventEmitter } from "events";
import { Client } from "discord.js";
import { info, error } from "../logger.js";

/**
 * Health status enumeration
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
  UNKNOWN = "unknown",
}

/**
 * Metric types for different measurements
 */
export enum MetricType {
  COUNTER = "counter",
  GAUGE = "gauge",
  HISTOGRAM = "histogram",
  TIMING = "timing",
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Service component health check result
 */
interface ServiceHealth {
  name: string;
  status: HealthStatus;
  latency_ms?: number;
  error?: string;
  details?: Record<string, any>;
  last_check: string;
}

/**
 * System resource metrics (used for health monitoring calculations)
 */
export interface ResourceMetrics {
  memory: {
    used_mb: number;
    free_mb: number;
    total_mb: number;
    usage_percent: number;
  };
  uptime_seconds: number;
  event_loop_delay_ms: number;
  active_handles: number;
  active_requests: number;
}

/**
 * Discord-specific health metrics (used for Discord API monitoring)
 */
export interface DiscordHealth {
  connected: boolean;
  user: {
    id: string;
    username: string;
    tag: string;
  } | null;
  guilds: number;
  channels: number;
  latency_ms: number;
  shard_status?: {
    id: number;
    status: string;
    latency: number;
  }[];
}

/**
 * Performance metric data point
 */
interface MetricPoint {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

/**
 * Alert configuration
 */
interface AlertConfig {
  name: string;
  condition: (metrics: MetricPoint[], health: ServiceHealth[]) => boolean;
  severity: AlertSeverity;
  message: string;
  cooldown_minutes: number;
  enabled: boolean;
}

/**
 * Health check configuration
 */
interface HealthCheckConfig {
  interval_ms: number;
  timeout_ms: number;
  enable_discord_checks: boolean;
  enable_resource_monitoring: boolean;
  enable_performance_tracking: boolean;
  max_metric_history: number;
  alert_webhook_url?: string;
}

/**
 * Comprehensive Health Monitoring Service
 */
export class HealthMonitoringService extends EventEmitter {
  private config: HealthCheckConfig;
  private client: Client | null = null;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: MetricPoint[] = [];
  private healthHistory: ServiceHealth[] = [];
  private alerts: AlertConfig[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private startTime: number = Date.now();

  constructor(config?: Partial<HealthCheckConfig>) {
    super();

    this.config = {
      interval_ms: 30000, // Check every 30 seconds
      timeout_ms: 10000, // 10 second timeout
      enable_discord_checks: true,
      enable_resource_monitoring: true,
      enable_performance_tracking: true,
      max_metric_history: 1000,
      ...config,
    };

    this.setupDefaultAlerts();
  }

  /**
   * Initialize health monitoring with Discord client
   */
  initialize(client: Client): void {
    this.client = client;
    info("Health monitoring service initialized");
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();

    // Initial health check
    this.performHealthCheck();

    // Setup periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval_ms);

    info(
      `Health monitoring started with ${this.config.interval_ms}ms interval`,
    );
    this.emit("monitoring_started");
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    info("Health monitoring stopped");
    this.emit("monitoring_stopped");
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const healthChecks: ServiceHealth[] = [];

    try {
      // Discord API health check
      if (this.config.enable_discord_checks && this.client) {
        const discordHealth = await this.checkDiscordHealth();
        healthChecks.push(discordHealth);
      }

      // System resource check
      if (this.config.enable_resource_monitoring) {
        const resourceHealth = this.checkResourceHealth();
        healthChecks.push(resourceHealth);
      }

      // Store health history
      this.healthHistory.unshift(...healthChecks);
      if (this.healthHistory.length > this.config.max_metric_history) {
        this.healthHistory = this.healthHistory.slice(
          0,
          this.config.max_metric_history,
        );
      }

      // Collect performance metrics
      if (this.config.enable_performance_tracking) {
        await this.collectMetrics(healthChecks);
      }

      // Check alert conditions
      await this.checkAlerts(healthChecks);

      // Emit health update event
      this.emit("health_updated", {
        overall_status: this.calculateOverallHealth(healthChecks),
        services: healthChecks,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      error(`Health check failed: ${err}`);
      this.emit("health_check_failed", err);
    }
  }

  /**
   * Check Discord API connectivity and performance
   */
  private async checkDiscordHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      if (!this.client || !this.client.isReady()) {
        return {
          name: "discord_api",
          status: HealthStatus.UNHEALTHY,
          error: "Discord client not ready or not connected",
          last_check: new Date().toISOString(),
          details: {
            connected: false,
            user: null,
          },
        };
      }

      // Test API connectivity by fetching current user
      const user = this.client.user;
      const guilds = this.client.guilds.cache.size;
      const channels = this.client.channels.cache.size;
      const latency = this.client.ws.ping;

      const responseTime = Date.now() - startTime;

      // Determine health status based on metrics
      let status = HealthStatus.HEALTHY;
      if (latency > 500 || responseTime > 2000) {
        status = HealthStatus.DEGRADED;
      }
      if (latency > 1000 || responseTime > 5000) {
        status = HealthStatus.UNHEALTHY;
      }

      return {
        name: "discord_api",
        status,
        latency_ms: responseTime,
        last_check: new Date().toISOString(),
        details: {
          connected: true,
          user: user
            ? {
                id: user.id,
                username: user.username,
                tag: user.tag,
              }
            : null,
          guilds,
          channels,
          websocket_latency: latency,
          websocket_status: this.client.ws.status,
        },
      };
    } catch (err) {
      return {
        name: "discord_api",
        status: HealthStatus.UNHEALTHY,
        latency_ms: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
        last_check: new Date().toISOString(),
        details: {
          connected: false,
        },
      };
    }
  }

  /**
   * Check system resource health
   */
  private checkResourceHealth(): ServiceHealth {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Convert bytes to MB
      const used_mb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const total_mb = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const usage_percent = Math.round((used_mb / total_mb) * 100);

      // Determine health based on resource usage
      let status = HealthStatus.HEALTHY;
      if (usage_percent > 80) {
        status = HealthStatus.DEGRADED;
      }
      if (usage_percent > 95) {
        status = HealthStatus.UNHEALTHY;
      }

      return {
        name: "system_resources",
        status,
        last_check: new Date().toISOString(),
        details: {
          memory: {
            used_mb,
            total_mb,
            usage_percent,
            external_mb: Math.round(memoryUsage.external / 1024 / 1024),
            array_buffers_mb: Math.round(
              memoryUsage.arrayBuffers / 1024 / 1024,
            ),
          },
          uptime_seconds: Math.round(uptime),
          pid: process.pid,
          node_version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };
    } catch (err) {
      return {
        name: "system_resources",
        status: HealthStatus.UNHEALTHY,
        error: err instanceof Error ? err.message : String(err),
        last_check: new Date().toISOString(),
      };
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectMetrics(healthChecks: ServiceHealth[]): Promise<void> {
    const timestamp = Date.now();
    const metrics: MetricPoint[] = [];

    // System metrics
    const memoryUsage = process.memoryUsage();
    metrics.push({
      name: "memory_usage_mb",
      type: MetricType.GAUGE,
      value: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      timestamp,
    });

    metrics.push({
      name: "uptime_seconds",
      type: MetricType.GAUGE,
      value: Math.round(process.uptime()),
      timestamp,
    });

    // Discord metrics
    if (this.client && this.client.isReady()) {
      metrics.push({
        name: "discord_guilds",
        type: MetricType.GAUGE,
        value: this.client.guilds.cache.size,
        timestamp,
      });

      metrics.push({
        name: "discord_channels",
        type: MetricType.GAUGE,
        value: this.client.channels.cache.size,
        timestamp,
      });

      metrics.push({
        name: "discord_latency_ms",
        type: MetricType.GAUGE,
        value: this.client.ws.ping,
        timestamp,
      });
    }

    // Service health status metrics (0 = unhealthy, 1 = degraded, 2 = healthy)
    for (const health of healthChecks) {
      let statusValue = 0;
      switch (health.status) {
        case HealthStatus.HEALTHY:
          statusValue = 2;
          break;
        case HealthStatus.DEGRADED:
          statusValue = 1;
          break;
        case HealthStatus.UNHEALTHY:
          statusValue = 0;
          break;
      }

      metrics.push({
        name: "service_health",
        type: MetricType.GAUGE,
        value: statusValue,
        timestamp,
        labels: { service: health.name },
      });

      if (health.latency_ms !== undefined) {
        metrics.push({
          name: "service_latency_ms",
          type: MetricType.GAUGE,
          value: health.latency_ms,
          timestamp,
          labels: { service: health.name },
        });
      }
    }

    // Store metrics
    this.metricsHistory.unshift(...metrics);
    if (this.metricsHistory.length > this.config.max_metric_history) {
      this.metricsHistory = this.metricsHistory.slice(
        0,
        this.config.max_metric_history,
      );
    }

    this.emit("metrics_collected", metrics);
  }

  /**
   * Calculate overall system health status
   */
  private calculateOverallHealth(services: ServiceHealth[]): HealthStatus {
    if (services.length === 0) {
      return HealthStatus.UNKNOWN;
    }

    const statuses = services.map((s) => s.status);

    if (statuses.includes(HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY;
    }

    if (statuses.includes(HealthStatus.DEGRADED)) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  /**
   * Setup default alert configurations
   */
  private setupDefaultAlerts(): void {
    this.alerts = [
      {
        name: "high_memory_usage",
        condition: (metrics, _health) => {
          const memoryMetric = metrics.find(
            (m) => m.name === "memory_usage_mb",
          );
          return memoryMetric ? memoryMetric.value > 500 : false;
        },
        severity: AlertSeverity.WARNING,
        message: "Memory usage is high (>500MB)",
        cooldown_minutes: 10,
        enabled: true,
      },
      {
        name: "discord_disconnected",
        condition: (_metrics, health) => {
          const discordHealth = health.find((h) => h.name === "discord_api");
          return discordHealth
            ? discordHealth.status === HealthStatus.UNHEALTHY
            : false;
        },
        severity: AlertSeverity.CRITICAL,
        message: "Discord API connection lost",
        cooldown_minutes: 5,
        enabled: true,
      },
      {
        name: "high_discord_latency",
        condition: (metrics, _health) => {
          const latencyMetric = metrics.find(
            (m) => m.name === "discord_latency_ms",
          );
          return latencyMetric ? latencyMetric.value > 1000 : false;
        },
        severity: AlertSeverity.WARNING,
        message: "Discord API latency is high (>1000ms)",
        cooldown_minutes: 15,
        enabled: true,
      },
      {
        name: "service_degraded",
        condition: (_metrics, health) => {
          return health.some((h) => h.status === HealthStatus.DEGRADED);
        },
        severity: AlertSeverity.WARNING,
        message: "One or more services are degraded",
        cooldown_minutes: 20,
        enabled: true,
      },
    ];
  }

  /**
   * Check alert conditions and trigger notifications
   */
  private async checkAlerts(healthChecks: ServiceHealth[]): Promise<void> {
    const currentTime = Date.now();
    const recentMetrics = this.metricsHistory.filter(
      (m) => currentTime - m.timestamp < 300000, // Last 5 minutes
    );

    for (const alert of this.alerts) {
      if (!alert.enabled) {
        continue;
      }

      // Check cooldown
      const lastAlert = this.alertCooldowns.get(alert.name) || 0;
      const cooldownExpired =
        currentTime - lastAlert > alert.cooldown_minutes * 60 * 1000;

      if (!cooldownExpired) {
        continue;
      }

      // Evaluate alert condition
      try {
        if (alert.condition(recentMetrics, healthChecks)) {
          await this.triggerAlert(alert);
          this.alertCooldowns.set(alert.name, currentTime);
        }
      } catch (err) {
        error(`Alert evaluation failed for ${alert.name}: ${err}`);
      }
    }
  }

  /**
   * Trigger an alert notification
   */
  private async triggerAlert(alert: AlertConfig): Promise<void> {
    const alertData = {
      name: alert.name,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date().toISOString(),
      service: "mcp-discord-server",
    };

    // Emit alert event
    this.emit("alert_triggered", alertData);

    // Log alert
    const logLevel = alert.severity === AlertSeverity.CRITICAL ? error : info;
    logLevel(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

    // Send webhook notification if configured
    if (this.config.alert_webhook_url) {
      try {
        await this.sendWebhookAlert(alertData);
      } catch (err) {
        error(`Failed to send webhook alert: ${err}`);
      }
    }
  }

  /**
   * Send alert via webhook
   */
  private async sendWebhookAlert(alertData: any): Promise<void> {
    if (!this.config.alert_webhook_url) {
      return;
    }

    const response = await fetch(this.config.alert_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "MCP Discord Monitor",
        embeds: [
          {
            title: "🚨 Health Alert",
            description: alertData.message,
            color: this.getAlertColor(alertData.severity),
            fields: [
              {
                name: "Service",
                value: alertData.service,
                inline: true,
              },
              {
                name: "Severity",
                value: alertData.severity.toUpperCase(),
                inline: true,
              },
              {
                name: "Time",
                value: alertData.timestamp,
                inline: true,
              },
            ],
            timestamp: alertData.timestamp,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }
  }

  /**
   * Get Discord embed color for alert severity
   */
  private getAlertColor(severity: AlertSeverity): number {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 0xff0000; // Red
      case AlertSeverity.ERROR:
        return 0xff6600; // Orange
      case AlertSeverity.WARNING:
        return 0xffff00; // Yellow
      case AlertSeverity.INFO:
        return 0x0099ff; // Blue
      default:
        return 0x808080; // Gray
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): {
    overall_status: HealthStatus;
    services: ServiceHealth[];
    uptime_seconds: number;
    last_check: string;
  } {
    const recentChecks = this.healthHistory.filter(
      (h) =>
        Date.now() - new Date(h.last_check).getTime() <
        this.config.interval_ms * 2,
    );

    // Group by service name and get most recent
    const serviceMap = new Map<string, ServiceHealth>();
    for (const check of recentChecks) {
      if (
        !serviceMap.has(check.name) ||
        new Date(check.last_check) >
          new Date(serviceMap.get(check.name)!.last_check)
      ) {
        serviceMap.set(check.name, check);
      }
    }

    const services = Array.from(serviceMap.values());

    return {
      overall_status: this.calculateOverallHealth(services),
      services,
      uptime_seconds: Math.round((Date.now() - this.startTime) / 1000),
      last_check: new Date().toISOString(),
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics(timespan_minutes: number = 60): {
    metrics: MetricPoint[];
    summary: Record<string, any>;
  } {
    const cutoff = Date.now() - timespan_minutes * 60 * 1000;
    const recentMetrics = this.metricsHistory.filter(
      (m) => m.timestamp > cutoff,
    );

    // Calculate summary statistics
    const summary: Record<string, any> = {};
    const metricGroups = new Map<string, number[]>();

    for (const metric of recentMetrics) {
      const key = metric.labels
        ? `${metric.name}:${Object.entries(metric.labels)
            .map(([k, v]) => `${k}=${v}`)
            .join(",")}`
        : metric.name;

      if (!metricGroups.has(key)) {
        metricGroups.set(key, []);
      }
      metricGroups.get(key)!.push(metric.value);
    }

    for (const [name, values] of metricGroups) {
      if (values.length === 0) continue;

      summary[name] = {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return {
      metrics: recentMetrics,
      summary,
    };
  }

  /**
   * Add custom alert
   */
  addAlert(alert: AlertConfig): void {
    this.alerts.push(alert);
    info(`Custom alert added: ${alert.name}`);
  }

  /**
   * Remove alert by name
   */
  removeAlert(name: string): boolean {
    const index = this.alerts.findIndex((a) => a.name === name);
    if (index >= 0) {
      this.alerts.splice(index, 1);
      this.alertCooldowns.delete(name);
      info(`Alert removed: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Update alert configuration
   */
  updateAlert(name: string, updates: Partial<AlertConfig>): boolean {
    const alert = this.alerts.find((a) => a.name === name);
    if (alert) {
      Object.assign(alert, updates);
      info(`Alert updated: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Get alert configurations
   */
  getAlerts(): AlertConfig[] {
    return [...this.alerts];
  }

  /**
   * Record custom metric
   */
  recordMetric(
    name: string,
    type: MetricType,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const metric: MetricPoint = {
      name,
      type,
      value,
      timestamp: Date.now(),
      labels,
    };

    this.metricsHistory.unshift(metric);
    if (this.metricsHistory.length > this.config.max_metric_history) {
      this.metricsHistory = this.metricsHistory.slice(
        0,
        this.config.max_metric_history,
      );
    }

    this.emit("metric_recorded", metric);
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metricsHistory = [];
    this.healthHistory = [];
    info("Metrics history cleared");
  }

  /**
   * Shutdown monitoring service
   */
  shutdown(): void {
    this.stop();
    this.clearMetrics();
    this.alerts = [];
    this.alertCooldowns.clear();
    info("Health monitoring service shutdown complete");
  }
}
