/**
 * @fileoverview Enhanced Error Handling Service with Circuit Breaker
 * @description Implements advanced error handling with retry mechanisms,
 * circuit breaker patterns, error categorization, and graceful degradation
 */

import { EventEmitter } from "events";
import { info, error } from "../logger.js";

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  PERMISSION = "permission",
  RATE_LIMIT = "rate_limit",
  VALIDATION = "validation",
  UNKNOWN_RESOURCE = "unknown_resource",
  SERVER_ERROR = "server_error",
  CLIENT_ERROR = "client_error",
  TIMEOUT = "timeout",
  SYSTEM = "system",
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

/**
 * Categorized error information
 */
interface CategorizedError {
  original: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
  suggestedAction?: string;
  context?: Record<string, any>;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitterMs: number;
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

/**
 * Circuit breaker metrics
 */
interface CircuitBreakerMetrics {
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

/**
 * Error handling service configuration
 */
interface ErrorHandlingConfig {
  enableRetry: boolean;
  enableCircuitBreaker: boolean;
  enableGracefulDegradation: boolean;
  retryConfig: RetryConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
  maxErrorsToTrack: number;
}

/**
 * Graceful degradation fallback
 */
interface FallbackFunction<T> {
  (): Promise<T>;
}

/**
 * Enhanced Error Handling Service
 */
export class ErrorHandlingService extends EventEmitter {
  private config: ErrorHandlingConfig;
  private circuitBreakers: Map<
    string,
    {
      state: CircuitBreakerState;
      metrics: CircuitBreakerMetrics;
      config: CircuitBreakerConfig;
      resetTimer?: NodeJS.Timeout;
    }
  > = new Map();
  private errorHistory: CategorizedError[] = [];
  private fallbackFunctions: Map<string, FallbackFunction<any>> = new Map();

  constructor(config?: Partial<ErrorHandlingConfig>) {
    super();

    this.config = {
      enableRetry: true,
      enableCircuitBreaker: true,
      enableGracefulDegradation: true,
      retryConfig: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        exponentialBase: 2,
        jitterMs: 100,
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        successThreshold: 3,
        timeoutMs: 10000,
        resetTimeoutMs: 60000,
        monitoringWindowMs: 300000, // 5 minutes
      },
      maxErrorsToTrack: 1000,
      ...config,
    };
  }

  /**
   * Execute an operation with comprehensive error handling
   */
  async executeWithErrorHandling<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>,
    fallback?: FallbackFunction<T>,
  ): Promise<T> {
    // Check circuit breaker state
    if (this.config.enableCircuitBreaker && this.isCircuitOpen(operationName)) {
      const error = new Error(`Circuit breaker is open for ${operationName}`);
      if (fallback && this.config.enableGracefulDegradation) {
        info(`Using fallback for ${operationName} due to open circuit`);
        return await fallback();
      }
      throw error;
    }

    let lastError: Error | undefined;
    const maxAttempts = this.config.enableRetry
      ? this.config.retryConfig.maxAttempts
      : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          operation,
          this.config.circuitBreakerConfig.timeoutMs,
        );

        // Record success
        if (this.config.enableCircuitBreaker) {
          this.recordSuccess(operationName);
        }

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const categorizedError = this.categorizeError(lastError, context);

        // Record failure
        if (this.config.enableCircuitBreaker) {
          this.recordFailure(operationName);
        }

        // Track error
        this.trackError(categorizedError);

        // Check if should retry
        if (attempt < maxAttempts && categorizedError.isRetryable) {
          const delay = this.calculateRetryDelay(attempt);
          info(
            `Attempt ${attempt} failed for ${operationName}, retrying in ${delay}ms: ${lastError.message}`,
          );
          await this.sleep(delay);
          continue;
        }

        // No more retries, break out of loop
        break;
      }
    }

    // All attempts failed, try fallback
    if (fallback && this.config.enableGracefulDegradation) {
      try {
        info(`All attempts failed for ${operationName}, using fallback`);
        return await fallback();
      } catch (fallbackError) {
        error(`Fallback also failed for ${operationName}: ${fallbackError}`);
        // Continue to throw original error
      }
    }

    // Emit error event for monitoring
    this.emit("operationFailed", {
      operationName,
      error: lastError,
      attempts: maxAttempts,
      context,
    });

    throw lastError!;
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Operation timeout"));
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  /**
   * Categorize error based on type and characteristics
   */
  categorizeError(err: Error, context?: Record<string, any>): CategorizedError {
    const errorMessage = err.message.toLowerCase();
    const errorCode = (err as any).code;

    let category = ErrorCategory.SYSTEM;
    let severity = ErrorSeverity.MEDIUM;
    let isRetryable = false;
    let suggestedAction: string | undefined;

    // Discord API specific errors
    if (errorCode === 50001 || errorMessage.includes("missing access")) {
      category = ErrorCategory.PERMISSION;
      severity = ErrorSeverity.HIGH;
      isRetryable = false;
      suggestedAction = "Check bot permissions and server membership";
    } else if (
      errorCode === 50013 ||
      errorMessage.includes("missing permissions")
    ) {
      category = ErrorCategory.PERMISSION;
      severity = ErrorSeverity.HIGH;
      isRetryable = false;
      suggestedAction = "Grant required permissions to the bot";
    } else if (errorCode === 10004 || errorMessage.includes("unknown guild")) {
      category = ErrorCategory.UNKNOWN_RESOURCE;
      severity = ErrorSeverity.HIGH;
      isRetryable = false;
      suggestedAction = "Verify guild ID and bot membership";
    } else if (
      errorCode === 10008 ||
      errorMessage.includes("unknown message")
    ) {
      category = ErrorCategory.UNKNOWN_RESOURCE;
      severity = ErrorSeverity.MEDIUM;
      isRetryable = false;
      suggestedAction = "Verify message ID and channel access";
    } else if (errorCode === 429 || errorMessage.includes("rate limit")) {
      category = ErrorCategory.RATE_LIMIT;
      severity = ErrorSeverity.MEDIUM;
      isRetryable = true;
      suggestedAction = "Reduce request frequency";
    } else if (errorCode === 401 || errorMessage.includes("unauthorized")) {
      category = ErrorCategory.AUTHENTICATION;
      severity = ErrorSeverity.CRITICAL;
      isRetryable = false;
      suggestedAction = "Check bot token validity";
    } else if (errorCode === 403 || errorMessage.includes("forbidden")) {
      category = ErrorCategory.PERMISSION;
      severity = ErrorSeverity.HIGH;
      isRetryable = false;
      suggestedAction = "Review bot permissions and server settings";
    }

    // Network errors
    else if (
      errorMessage.includes("network") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout")
    ) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      isRetryable = true;
      suggestedAction = "Check network connectivity";
    }

    // Server errors (5xx)
    else if (
      errorMessage.includes("server error") ||
      errorMessage.includes("internal error")
    ) {
      category = ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
      isRetryable = true;
      suggestedAction = "Retry after a short delay";
    }

    // Validation errors
    else if (
      errorMessage.includes("invalid") ||
      errorMessage.includes("validation")
    ) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
      isRetryable = false;
      suggestedAction = "Check input parameters";
    }

    // Timeout errors
    else if (errorMessage.includes("timeout")) {
      category = ErrorCategory.TIMEOUT;
      severity = ErrorSeverity.MEDIUM;
      isRetryable = true;
      suggestedAction = "Increase timeout or retry";
    }

    return {
      original: err,
      category,
      severity,
      isRetryable,
      suggestedAction,
      context,
    };
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.retryConfig.baseDelayMs *
        Math.pow(this.config.retryConfig.exponentialBase, attempt - 1),
      this.config.retryConfig.maxDelayMs,
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * this.config.retryConfig.jitterMs;

    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Track error in history for analysis
   */
  private trackError(categorizedError: CategorizedError): void {
    this.errorHistory.unshift(categorizedError);

    // Keep only recent errors
    if (this.errorHistory.length > this.config.maxErrorsToTrack) {
      this.errorHistory = this.errorHistory.slice(
        0,
        this.config.maxErrorsToTrack,
      );
    }

    // Emit error event
    this.emit("errorCategorized", categorizedError);

    // Log detailed error information
    error(
      `Categorized Error [${categorizedError.severity}]: ${categorizedError.category} - ${categorizedError.original.message} | Context: ${JSON.stringify(
        {
          category: categorizedError.category,
          severity: categorizedError.severity,
          retryable: categorizedError.isRetryable,
          suggestion: categorizedError.suggestedAction,
          context: categorizedError.context,
        },
      )}`,
    );
  }

  /**
   * Check if circuit breaker is open for an operation
   */
  private isCircuitOpen(operationName: string): boolean {
    const cb = this.circuitBreakers.get(operationName);
    if (!cb) {
      this.initializeCircuitBreaker(operationName);
      return false;
    }

    return cb.state === CircuitBreakerState.OPEN;
  }

  /**
   * Initialize circuit breaker for an operation
   */
  private initializeCircuitBreaker(operationName: string): void {
    this.circuitBreakers.set(operationName, {
      state: CircuitBreakerState.CLOSED,
      metrics: {
        failures: 0,
        successes: 0,
        requests: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
      },
      config: { ...this.config.circuitBreakerConfig },
    });
  }

  /**
   * Record successful operation
   */
  private recordSuccess(operationName: string): void {
    let cb = this.circuitBreakers.get(operationName);
    if (!cb) {
      this.initializeCircuitBreaker(operationName);
      cb = this.circuitBreakers.get(operationName)!;
    }

    cb.metrics.successes++;
    cb.metrics.requests++;
    cb.metrics.lastSuccessTime = Date.now();

    // Check if should transition to closed state
    if (
      cb.state === CircuitBreakerState.HALF_OPEN &&
      cb.metrics.successes >= cb.config.successThreshold
    ) {
      this.transitionToClosedState(operationName, cb);
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operationName: string): void {
    let cb = this.circuitBreakers.get(operationName);
    if (!cb) {
      this.initializeCircuitBreaker(operationName);
      cb = this.circuitBreakers.get(operationName)!;
    }

    cb.metrics.failures++;
    cb.metrics.requests++;
    cb.metrics.lastFailureTime = Date.now();

    // Check if should transition to open state
    if (
      cb.state === CircuitBreakerState.CLOSED &&
      cb.metrics.failures >= cb.config.failureThreshold
    ) {
      this.transitionToOpenState(operationName, cb);
    } else if (cb.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionToOpenState(operationName, cb);
    }
  }

  /**
   * Transition circuit breaker to open state
   */
  private transitionToOpenState(operationName: string, cb: any): void {
    cb.state = CircuitBreakerState.OPEN;

    // Set timer to transition to half-open
    cb.resetTimer = setTimeout(() => {
      this.transitionToHalfOpenState(operationName, cb);
    }, cb.config.resetTimeoutMs);

    this.emit("circuitBreakerOpened", { operationName, metrics: cb.metrics });
    info(`Circuit breaker opened for ${operationName}`);
  }

  /**
   * Transition circuit breaker to half-open state
   */
  private transitionToHalfOpenState(operationName: string, cb: any): void {
    cb.state = CircuitBreakerState.HALF_OPEN;
    cb.metrics.successes = 0; // Reset success counter

    this.emit("circuitBreakerHalfOpened", { operationName });
    info(`Circuit breaker half-opened for ${operationName}`);
  }

  /**
   * Transition circuit breaker to closed state
   */
  private transitionToClosedState(operationName: string, cb: any): void {
    cb.state = CircuitBreakerState.CLOSED;
    cb.metrics.failures = 0; // Reset failure counter
    cb.metrics.successes = 0; // Reset success counter

    if (cb.resetTimer) {
      clearTimeout(cb.resetTimer);
      cb.resetTimer = undefined;
    }

    this.emit("circuitBreakerClosed", { operationName });
    info(`Circuit breaker closed for ${operationName}`);
  }

  /**
   * Register fallback function for graceful degradation
   */
  registerFallback<T>(
    operationName: string,
    fallback: FallbackFunction<T>,
  ): void {
    this.fallbackFunctions.set(operationName, fallback);
    info(`Fallback registered for ${operationName}`);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter((e) =>
      e.context?.timestamp ? e.context.timestamp > last24h : true,
    );

    const byCategory = recentErrors.reduce(
      (acc, error) => {
        acc[error.category] = (acc[error.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const bySeverity = recentErrors.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const circuitBreakerStates = Object.fromEntries(
      Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [
        name,
        {
          state: cb.state,
          failures: cb.metrics.failures,
          successes: cb.metrics.successes,
          requests: cb.metrics.requests,
        },
      ]),
    );

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      byCategory,
      bySeverity,
      circuitBreakers: circuitBreakerStates,
      retryableErrors: recentErrors.filter((e) => e.isRetryable).length,
      nonRetryableErrors: recentErrors.filter((e) => !e.isRetryable).length,
    };
  }

  /**
   * Reset circuit breaker for an operation
   */
  resetCircuitBreaker(operationName: string): void {
    const cb = this.circuitBreakers.get(operationName);
    if (cb) {
      this.transitionToClosedState(operationName, cb);
      info(`Circuit breaker manually reset for ${operationName}`);
    }
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    info("Error history cleared");
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Shutdown error handling service
   */
  shutdown(): void {
    // Clear all circuit breaker timers
    for (const [, cb] of this.circuitBreakers.entries()) {
      if (cb.resetTimer) {
        clearTimeout(cb.resetTimer);
      }
    }

    this.circuitBreakers.clear();
    this.errorHistory = [];
    this.fallbackFunctions.clear();

    info("Error handling service shutdown complete");
  }
}
