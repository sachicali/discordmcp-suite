/**
 * @fileoverview Comprehensive Monitoring & Analytics Service
 * @description Provides real-time monitoring, performance analytics, health checks,
 * and usage statistics for the Discord MCP Server
 */

import { EventEmitter } from "events";
import { Client } from "discord.js";
import { info, error } from "../logger.js";
import fs from "fs/promises";
import path from "path";

/**
 * Metric types for different categories
 */
export enum MetricType {
  COUNTER = "counter",
  GAUGE = "gauge",
  HISTOGRAM = "histogram",
  TIMER = "timer",
}

/**
 * Metric data structure
 */
interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
  unit?: string;
}

/**
 * Performance sample for histograms
 */
interface PerformanceSample {
  value: number;
  timestamp: number;
}

/**
 * Health check result
 */
interface HealthCheckResult {
  component: string;
  status: "healthy" | "warning" | "critical";
  message: string;
  timestamp: number;
  responseTime?: number;
  details?: Record<string, any>;
}

/**
 * Usage statistics
 */
interface UsageStats {
  toolCalls: Map<string, number>;
  userActivity: Map<string, number>;
  guildActivity: Map<string, number>;
  errorRates: Map<string, number>;
  responseTimesMs: Map<string, PerformanceSample[]>;
}

/**
 * Monitoring configuration
 */
interface MonitoringConfig {
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  enableUsageStats: boolean;
  metricsRetention: number; // days
  healthCheckInterval: number; // seconds
  alertThresholds: {
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    memoryUsage: number; // MB
    diskUsage: number; // percentage
  };
  exportMetrics: boolean;
  metricsPath: string;
}

/**
 * Comprehensive Monitoring Service
 */
export class MonitoringService extends EventEmitter {
  private config: MonitoringConfig;
  private metrics: Map<string, Metric[]> = new Map();
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private usageStats: UsageStats;
  private performanceTimers: Map<string, number> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCleanupInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();

    this.config = {
      enableMetrics: true,
      enableHealthChecks: true,
      enableUsageStats: true,
      metricsRetention: 7, // 7 days
      healthCheckInterval: 30, // 30 seconds
      alertThresholds: {
        errorRate: 5, // 5%
        responseTime: 5000, // 5 seconds
        memoryUsage: 1000, // 1GB
        diskUsage: 80, // 80%
      },
      exportMetrics: true,
      metricsPath: "./metrics",
      ...config,
    };

    this.usageStats = {
      toolCalls: new Map(),
      userActivity: new Map(),
      guildActivity: new Map(),
      errorRates: new Map(),
      responseTimesMs: new Map(),
    };

    this.startMonitoring();
  }

  /**
   * Record a metric value
   */
  recordMetric(
    name: string,
    type: MetricType,
    value: number,
    labels?: Record<string, string>,
    unit?: string,
  ): void {
    if (!this.config.enableMetrics) return;

    const metric: Metric = {
      name,
      type,
      value,
      timestamp: Date.now(),
      labels,
      unit,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only recent metrics for histograms and timers
    if (type === MetricType.HISTOGRAM || type === MetricType.TIMER) {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
      const filtered = metricArray.filter((m) => m.timestamp > cutoff);
      this.metrics.set(name, filtered);
    }

    // Emit alert if threshold exceeded
    this.checkAlertThresholds(name, value, type);

    info(`Metric recorded: ${name}=${value}${unit ? unit : ""} (${type})`);
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): void {
    this.performanceTimers.set(name, Date.now());
  }

  /**
   * End a performance timer and record the duration
   */
  endTimer(name: string, labels?: Record<string, string>): number {
    const startTime = this.performanceTimers.get(name);
    if (!startTime) {
      error(`Timer ${name} was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.performanceTimers.delete(name);

    this.recordMetric(
      `${name}_duration`,
      MetricType.TIMER,
      duration,
      labels,
      "ms",
    );
    this.recordResponseTime(name, duration);

    return duration;
  }

  /**
   * Record tool usage
   */
  recordToolUsage(
    toolName: string,
    userId?: string,
    guildId?: string,
    success: boolean = true,
  ): void {
    if (!this.config.enableUsageStats) return;

    // Count tool calls
    const currentCount = this.usageStats.toolCalls.get(toolName) || 0;
    this.usageStats.toolCalls.set(toolName, currentCount + 1);

    // Track user activity
    if (userId) {
      const userCount = this.usageStats.userActivity.get(userId) || 0;
      this.usageStats.userActivity.set(userId, userCount + 1);
    }

    // Track guild activity
    if (guildId) {
      const guildCount = this.usageStats.guildActivity.get(guildId) || 0;
      this.usageStats.guildActivity.set(guildId, guildCount + 1);
    }

    // Track error rates
    if (!success) {
      const errorCount = this.usageStats.errorRates.get(toolName) || 0;
      this.usageStats.errorRates.set(toolName, errorCount + 1);
    }

    this.recordMetric("tool_usage", MetricType.COUNTER, 1, {
      tool: toolName,
      success: success.toString(),
      user: userId || "unknown",
      guild: guildId || "unknown",
    });
  }

  /**
   * Record response time for performance analysis
   */
  private recordResponseTime(operation: string, duration: number): void {
    if (!this.usageStats.responseTimesMs.has(operation)) {
      this.usageStats.responseTimesMs.set(operation, []);
    }

    const samples = this.usageStats.responseTimesMs.get(operation)!;
    samples.push({ value: duration, timestamp: Date.now() });

    // Keep only last 1000 samples per operation
    if (samples.length > 1000) {
      samples.splice(0, samples.length - 1000);
    }
  }

  /**
   * Perform health checks
   */
  async performHealthChecks(
    client: Client,
  ): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    // Discord client health check
    results.set("discord_client", await this.checkDiscordClient(client));

    // Memory health check
    results.set("memory", await this.checkMemory());

    // Disk space health check
    results.set("disk_space", await this.checkDiskSpace());

    // Response time health check
    results.set("response_times", await this.checkResponseTimes());

    // Error rate health check
    results.set("error_rates", await this.checkErrorRates());

    // Store results
    results.forEach((result, component) => {
      this.healthChecks.set(component, result);
    });

    return results;
  }

  /**
   * Check Discord client health
   */
  private async checkDiscordClient(client: Client): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const isReady = client.isReady();
      const hasToken = !!client.token;
      const ping = client.ws.ping;

      const responseTime = Date.now() - startTime;

      let status: "healthy" | "warning" | "critical" = "healthy";
      let message = "Discord client is healthy";

      if (!isReady || !hasToken) {
        status = "critical";
        message = "Discord client is not ready or missing token";
      } else if (ping > 1000) {
        status = "warning";
        message = `High Discord API latency: ${ping}ms`;
      }

      return {
        component: "discord_client",
        status,
        message,
        timestamp: Date.now(),
        responseTime,
        details: {
          ready: isReady,
          hasToken,
          ping,
          guilds: client.guilds.cache.size,
        },
      };
    } catch (err) {
      return {
        component: "discord_client",
        status: "critical",
        message: `Discord client error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const rssMB = memUsage.rss / 1024 / 1024;

    let status: "healthy" | "warning" | "critical" = "healthy";
    let message = `Memory usage: ${Math.round(heapUsedMB)}MB`;

    if (heapUsedMB > this.config.alertThresholds.memoryUsage) {
      status = "critical";
      message = `High memory usage: ${Math.round(heapUsedMB)}MB (threshold: ${this.config.alertThresholds.memoryUsage}MB)`;
    } else if (heapUsedMB > this.config.alertThresholds.memoryUsage * 0.8) {
      status = "warning";
      message = `Elevated memory usage: ${Math.round(heapUsedMB)}MB`;
    }

    return {
      component: "memory",
      status,
      message,
      timestamp: Date.now(),
      details: {
        heapUsedMB: Math.round(heapUsedMB),
        heapTotalMB: Math.round(heapTotalMB),
        rssMB: Math.round(rssMB),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
    };
  }

  /**
   * Check disk space (simplified check)
   */
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      // Note: This is a simplified check. In production, you might want to use a library like 'check-disk-space'
      await fs.stat("./");

      return {
        component: "disk_space",
        status: "healthy",
        message: "Disk space check completed",
        timestamp: Date.now(),
        details: {
          note: "Simplified disk check - consider using check-disk-space library for production",
        },
      };
    } catch (err) {
      return {
        component: "disk_space",
        status: "warning",
        message: `Could not check disk space: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check average response times
   */
  private async checkResponseTimes(): Promise<HealthCheckResult> {
    const avgResponseTimes = this.calculateAverageResponseTimes();

    let status: "healthy" | "warning" | "critical" = "healthy";
    let message = "Response times are normal";
    let worstOperation = "";
    let worstTime = 0;

    // Find the worst performing operation
    for (const [operation, avgTime] of avgResponseTimes.entries()) {
      if (avgTime > worstTime) {
        worstTime = avgTime;
        worstOperation = operation;
      }
    }

    if (worstTime > this.config.alertThresholds.responseTime) {
      status = "critical";
      message = `Slow response times detected: ${worstOperation} averaging ${Math.round(worstTime)}ms`;
    } else if (worstTime > this.config.alertThresholds.responseTime * 0.7) {
      status = "warning";
      message = `Elevated response times: ${worstOperation} averaging ${Math.round(worstTime)}ms`;
    }

    return {
      component: "response_times",
      status,
      message,
      timestamp: Date.now(),
      details: Object.fromEntries(
        Array.from(avgResponseTimes.entries()).map(([op, time]) => [
          op,
          Math.round(time),
        ]),
      ),
    };
  }

  /**
   * Check error rates
   */
  private async checkErrorRates(): Promise<HealthCheckResult> {
    const errorRates = this.calculateErrorRates();

    let status: "healthy" | "warning" | "critical" = "healthy";
    let message = "Error rates are normal";
    let worstTool = "";
    let worstRate = 0;

    // Find the tool with the highest error rate
    for (const [tool, rate] of errorRates.entries()) {
      if (rate > worstRate) {
        worstRate = rate;
        worstTool = tool;
      }
    }

    if (worstRate > this.config.alertThresholds.errorRate) {
      status = "critical";
      message = `High error rate detected: ${worstTool} at ${worstRate.toFixed(1)}%`;
    } else if (worstRate > this.config.alertThresholds.errorRate * 0.7) {
      status = "warning";
      message = `Elevated error rate: ${worstTool} at ${worstRate.toFixed(1)}%`;
    }

    return {
      component: "error_rates",
      status,
      message,
      timestamp: Date.now(),
      details: Object.fromEntries(
        Array.from(errorRates.entries()).map(([tool, rate]) => [
          tool,
          `${rate.toFixed(1)}%`,
        ]),
      ),
    };
  }

  /**
   * Calculate average response times for each operation
   */
  private calculateAverageResponseTimes(): Map<string, number> {
    const avgTimes = new Map<string, number>();

    for (const [
      operation,
      samples,
    ] of this.usageStats.responseTimesMs.entries()) {
      if (samples.length === 0) continue;

      const recentSamples = samples.filter(
        (s) => Date.now() - s.timestamp < 300000, // Last 5 minutes
      );

      if (recentSamples.length === 0) continue;

      const average =
        recentSamples.reduce((sum, s) => sum + s.value, 0) /
        recentSamples.length;
      avgTimes.set(operation, average);
    }

    return avgTimes;
  }

  /**
   * Calculate error rates for each tool
   */
  private calculateErrorRates(): Map<string, number> {
    const errorRates = new Map<string, number>();

    for (const [tool, errorCount] of this.usageStats.errorRates.entries()) {
      const totalCount = this.usageStats.toolCalls.get(tool) || 0;
      if (totalCount === 0) continue;

      const errorRate = (errorCount / totalCount) * 100;
      errorRates.set(tool, errorRate);
    }

    return errorRates;
  }

  /**
   * Check alert thresholds and emit alerts
   */
  private checkAlertThresholds(
    name: string,
    value: number,
    _type: MetricType,
  ): void {
    // Memory usage alerts
    if (
      name === "memory_usage_mb" &&
      value > this.config.alertThresholds.memoryUsage
    ) {
      this.emit("alert", {
        type: "memory",
        severity: "critical",
        message: `High memory usage: ${value}MB`,
        threshold: this.config.alertThresholds.memoryUsage,
        value,
      });
    }

    // Response time alerts
    if (
      name.endsWith("_duration") &&
      value > this.config.alertThresholds.responseTime
    ) {
      this.emit("alert", {
        type: "performance",
        severity: "warning",
        message: `Slow operation: ${name} took ${value}ms`,
        threshold: this.config.alertThresholds.responseTime,
        value,
      });
    }
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    return {
      uptime: uptime,
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        externalMB: Math.round(memUsage.external / 1024 / 1024),
      },
      toolUsage: Object.fromEntries(this.usageStats.toolCalls.entries()),
      errorRates: Object.fromEntries(this.calculateErrorRates().entries()),
      averageResponseTimes: Object.fromEntries(
        this.calculateAverageResponseTimes().entries(),
      ),
      healthChecks: Object.fromEntries(this.healthChecks.entries()),
    };
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(): Promise<void> {
    if (!this.config.exportMetrics) return;

    try {
      await fs.mkdir(this.config.metricsPath, { recursive: true });

      const metricsData = {
        timestamp: new Date().toISOString(),
        system: this.getSystemMetrics(),
        metrics: Object.fromEntries(
          Array.from(this.metrics.entries()).map(([name, values]) => [
            name,
            values.slice(-100), // Keep last 100 values
          ]),
        ),
      };

      const filename = `metrics-${new Date().toISOString().split("T")[0]}.json`;
      const filepath = path.join(this.config.metricsPath, filename);

      await fs.writeFile(filepath, JSON.stringify(metricsData, null, 2));
      info(`Metrics exported to ${filepath}`);
    } catch (err) {
      error(`Failed to export metrics: ${err}`);
    }
  }

  /**
   * Start monitoring services
   */
  private startMonitoring(): void {
    if (this.config.enableHealthChecks) {
      this.healthCheckInterval = setInterval(() => {
        // Health checks will be performed when requested
        info("Health check interval triggered");
      }, this.config.healthCheckInterval * 1000);
    }

    // Start metrics cleanup
    this.metricsCleanupInterval = setInterval(
      () => {
        this.cleanupOldMetrics();
      },
      60 * 60 * 1000,
    ); // Every hour

    // Record system metrics periodically
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.recordMetric(
        "memory_usage_mb",
        MetricType.GAUGE,
        memUsage.heapUsed / 1024 / 1024,
        {},
        "MB",
      );
      this.recordMetric(
        "memory_total_mb",
        MetricType.GAUGE,
        memUsage.heapTotal / 1024 / 1024,
        {},
        "MB",
      );
    }, 30000); // Every 30 seconds

    info("Monitoring service started");
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff =
      Date.now() - this.config.metricsRetention * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [name, values] of this.metrics.entries()) {
      const filtered = values.filter((m) => m.timestamp > cutoff);
      this.metrics.set(name, filtered);
      cleanedCount += values.length - filtered.length;
    }

    if (cleanedCount > 0) {
      info(`Cleaned up ${cleanedCount} old metric entries`);
    }
  }

  /**
   * Shutdown monitoring service
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
      this.metricsCleanupInterval = null;
    }

    // Export final metrics
    this.exportMetrics();

    info("Monitoring service shutdown complete");
  }
}
