/**
 * @fileoverview Advanced Rate Limiting Service for Discord API
 * @description Implements intelligent rate limiting with connection pooling,
 * request queuing, and memory optimization for enterprise Discord operations
 */

import { EventEmitter } from "events";
import { info, error } from "../logger.js";

/**
 * Rate limit bucket for Discord API endpoints
 */
interface RateLimitBucket {
  remaining: number;
  limit: number;
  resetTime: number;
  global: boolean;
}

/**
 * Queued request information
 */
interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  priority: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  data?: any;
  timestamp: number;
}

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  maxConcurrentRequests: number;
  maxQueueSize: number;
  defaultRetryDelay: number;
  maxRetryAttempts: number;
  memoryThresholdMB: number;
  priorityLevels: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Advanced Discord API Rate Limiter with enterprise features
 */
export class DiscordRateLimiter extends EventEmitter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private activeRequests: Set<string> = new Set();
  private globalRateLimit: boolean = false;
  private globalResetTime: number = 0;
  private config: RateLimiterConfig;
  private memoryMonitor: NodeJS.Timeout | null = null;
  private queueProcessor: NodeJS.Timeout | null = null;
  private metrics: {
    totalRequests: number;
    queuedRequests: number;
    rateLimitHits: number;
    retryAttempts: number;
    averageWaitTime: number;
    memoryUsage: number;
  };

  constructor(config?: Partial<RateLimiterConfig>) {
    super();

    this.config = {
      maxConcurrentRequests: 50,
      maxQueueSize: 1000,
      defaultRetryDelay: 1000,
      maxRetryAttempts: 3,
      memoryThresholdMB: 100,
      priorityLevels: {
        critical: 1,
        high: 2,
        medium: 3,
        low: 4,
      },
      ...config,
    };

    this.metrics = {
      totalRequests: 0,
      queuedRequests: 0,
      rateLimitHits: 0,
      retryAttempts: 0,
      averageWaitTime: 0,
      memoryUsage: 0,
    };

    this.startMonitoring();
    this.startQueueProcessor();
  }

  /**
   * Queue a request with rate limiting and priority handling
   */
  async queueRequest<T>(
    endpoint: string,
    method: string,
    executor: () => Promise<T>,
    priority: "critical" | "high" | "medium" | "low" = "medium",
    data?: any,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const request: QueuedRequest = {
        id: requestId,
        endpoint,
        method,
        priority: this.config.priorityLevels[priority],
        resolve: async () => {
          try {
            const result = await executor();
            resolve(result);
          } catch (err) {
            reject(err);
          }
        },
        reject,
        data,
        timestamp: Date.now(),
      };

      // Check queue size limits
      if (this.requestQueue.length >= this.config.maxQueueSize) {
        this.cleanupOldRequests();

        if (this.requestQueue.length >= this.config.maxQueueSize) {
          reject(new Error("Request queue is full. Server is overloaded."));
          return;
        }
      }

      this.requestQueue.push(request);
      this.metrics.queuedRequests++;
      this.metrics.totalRequests++;

      // Sort queue by priority (lower number = higher priority)
      this.requestQueue.sort((a, b) => a.priority - b.priority);

      info(
        `Request ${requestId} queued for ${endpoint} with ${priority} priority`,
      );
      this.emit("requestQueued", { requestId, endpoint, priority });
    });
  }

  /**
   * Check if request can be executed based on rate limits
   */
  private canExecuteRequest(endpoint: string): boolean {
    // Check global rate limit
    if (this.globalRateLimit && Date.now() < this.globalResetTime) {
      return false;
    } else if (this.globalRateLimit && Date.now() >= this.globalResetTime) {
      this.globalRateLimit = false;
    }

    // Check concurrent request limit
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return false;
    }

    // Check endpoint-specific rate limit
    const bucket = this.buckets.get(endpoint);
    if (bucket && bucket.remaining <= 0 && Date.now() < bucket.resetTime) {
      return false;
    }

    return true;
  }

  /**
   * Update rate limit information from Discord response headers
   */
  updateRateLimit(endpoint: string, headers: Record<string, string>): void {
    const remaining = parseInt(headers["x-ratelimit-remaining"] || "1");
    const limit = parseInt(headers["x-ratelimit-limit"] || "1");
    const resetAfter = parseFloat(headers["x-ratelimit-reset-after"] || "0");
    const global = headers["x-ratelimit-global"] === "true";

    if (global) {
      this.globalRateLimit = true;
      this.globalResetTime = Date.now() + resetAfter * 1000;
      this.metrics.rateLimitHits++;
      this.emit("globalRateLimit", { resetAfter });
    } else {
      this.buckets.set(endpoint, {
        remaining,
        limit,
        resetTime: Date.now() + resetAfter * 1000,
        global: false,
      });

      if (remaining === 0) {
        this.metrics.rateLimitHits++;
        this.emit("endpointRateLimit", { endpoint, resetAfter });
      }
    }
  }

  /**
   * Start processing the request queue
   */
  private startQueueProcessor(): void {
    this.queueProcessor = setInterval(() => {
      this.processQueue();
    }, 100); // Process queue every 100ms
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue[0];

      if (!this.canExecuteRequest(request.endpoint)) {
        break; // Wait for rate limits to reset
      }

      // Remove request from queue and mark as active
      this.requestQueue.shift();
      this.activeRequests.add(request.id);
      this.metrics.queuedRequests--;

      // Calculate wait time
      const waitTime = Date.now() - request.timestamp;
      this.updateAverageWaitTime(waitTime);

      // Execute request
      this.executeRequest(request);
    }
  }

  /**
   * Execute a queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    try {
      info(`Executing request ${request.id} for ${request.endpoint}`);
      request.resolve(null);
    } catch (err) {
      error(`Request ${request.id} failed: ${err}`);
      request.reject(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Start memory and performance monitoring
   */
  private startMonitoring(): void {
    this.memoryMonitor = setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;

      this.metrics.memoryUsage = memUsageMB;

      // Emit warnings for high memory usage
      if (memUsageMB > this.config.memoryThresholdMB) {
        this.emit("highMemoryUsage", {
          usage: memUsageMB,
          threshold: this.config.memoryThresholdMB,
        });
        this.cleanupMemory();
      }

      // Log metrics periodically
      info(
        `Rate Limiter Metrics: ${JSON.stringify({
          queueSize: this.requestQueue.length,
          activeRequests: this.activeRequests.size,
          memoryMB: Math.round(memUsageMB),
          totalRequests: this.metrics.totalRequests,
          rateLimitHits: this.metrics.rateLimitHits,
        })}`,
      );
    }, 30000); // Monitor every 30 seconds
  }

  /**
   * Clean up old requests from queue
   */
  private cleanupOldRequests(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    const originalLength = this.requestQueue.length;
    this.requestQueue = this.requestQueue.filter((request) => {
      const isOld = now - request.timestamp > maxAge;
      if (isOld) {
        request.reject(new Error("Request timeout - removed from queue"));
      }
      return !isOld;
    });

    const removed = originalLength - this.requestQueue.length;
    if (removed > 0) {
      info(`Cleaned up ${removed} old requests from queue`);
    }
  }

  /**
   * Clean up memory by removing old rate limit buckets
   */
  private cleanupMemory(): void {
    const now = Date.now();
    const bucketsToRemove: string[] = [];

    for (const [endpoint, bucket] of this.buckets) {
      if (now > bucket.resetTime + 60000) {
        // Remove buckets older than 1 minute after reset
        bucketsToRemove.push(endpoint);
      }
    }

    bucketsToRemove.forEach((endpoint) => {
      this.buckets.delete(endpoint);
    });

    if (bucketsToRemove.length > 0) {
      info(`Cleaned up ${bucketsToRemove.length} old rate limit buckets`);
    }
  }

  /**
   * Update average wait time metric
   */
  private updateAverageWaitTime(waitTime: number): void {
    const alpha = 0.1; // Exponential moving average factor
    this.metrics.averageWaitTime =
      this.metrics.averageWaitTime === 0
        ? waitTime
        : alpha * waitTime + (1 - alpha) * this.metrics.averageWaitTime;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      buckets: this.buckets.size,
    };
  }

  /**
   * Shutdown the rate limiter
   */
  shutdown(): void {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
      this.memoryMonitor = null;
    }

    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }

    // Reject all pending requests
    this.requestQueue.forEach((request) => {
      request.reject(new Error("Rate limiter is shutting down"));
    });
    this.requestQueue = [];
    this.activeRequests.clear();
  }
}
