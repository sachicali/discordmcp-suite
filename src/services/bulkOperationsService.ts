/**
 * @fileoverview Bulk Operations Service
 * @description Provides efficient bulk operations for Discord server management,
 * including batch message operations, member management, and channel operations.
 * Implements rate limiting, error handling, and progress tracking.
 *
 * Features:
 * - Bulk message deletion with filtering
 * - Batch member operations (roles, kicks, bans)
 * - Channel bulk operations
 * - Progress tracking and reporting
 * - Rate limit management
 * - Error recovery and retry logic
 *
 * @author MCP Discord Team
 * @version 1.0.0
 * @since 1.4.0
 */

import { EventEmitter } from "events";
import {
  Client,
  Guild,
  TextChannel,
  GuildMember,
  Message,
  Collection,
} from "discord.js";
import { info, error } from "../logger.js";

/**
 * Bulk operation types
 */
export enum BulkOperationType {
  DELETE_MESSAGES = "delete_messages",
  KICK_MEMBERS = "kick_members",
  BAN_MEMBERS = "ban_members",
  ADD_ROLES = "add_roles",
  REMOVE_ROLES = "remove_roles",
  DELETE_CHANNELS = "delete_channels",
  CREATE_CHANNELS = "create_channels",
  SEND_DMS = "send_dms",
}

/**
 * Operation status
 */
export enum OperationStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

/**
 * Message filter criteria
 */
export interface MessageFilter {
  before?: string; // Message ID
  after?: string; // Message ID
  user_id?: string;
  content_contains?: string;
  content_regex?: string;
  has_attachments?: boolean;
  has_embeds?: boolean;
  older_than_days?: number;
  is_bot?: boolean;
  is_pinned?: boolean;
}

/**
 * Member filter criteria
 */
export interface MemberFilter {
  joined_before?: Date;
  joined_after?: Date;
  has_roles?: string[];
  missing_roles?: string[];
  is_bot?: boolean;
  username_contains?: string;
  username_regex?: string;
  last_message_before?: Date;
  no_avatar?: boolean;
}

/**
 * Bulk operation configuration
 */
export interface BulkOperationConfig {
  id: string;
  type: BulkOperationType;
  guild_id: string;
  target_ids?: string[]; // Channel IDs, User IDs, etc.
  filters?: MessageFilter | MemberFilter;
  options?: Record<string, any>;
  batch_size: number;
  delay_between_batches: number;
  max_retries: number;
  dry_run: boolean;
  created_by: string;
  created_at: Date;
}

/**
 * Operation progress tracking
 */
export interface OperationProgress {
  operation_id: string;
  status: OperationStatus;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  current_batch: number;
  total_batches: number;
  started_at: Date;
  updated_at: Date;
  estimated_completion?: Date;
  errors: Array<{
    item_id: string;
    error: string;
    timestamp: Date;
  }>;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  operation_id: string;
  type: BulkOperationType;
  status: OperationStatus;
  total_items: number;
  successful_items: number;
  failed_items: number;
  duration_ms: number;
  errors: Array<{
    item_id: string;
    error: string;
  }>;
  summary: Record<string, any>;
}

/**
 * Bulk Operations Service
 */
export class BulkOperationsService extends EventEmitter {
  private client: Client | null = null;
  private operations: Map<string, OperationProgress> = new Map();
  private runningOperations: Map<
    string,
    {
      config: BulkOperationConfig;
      controller: AbortController;
    }
  > = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize the bulk operations service
   */
  initialize(client: Client): void {
    this.client = client;
    info("Bulk operations service initialized");
  }

  /**
   * Start a bulk message deletion operation
   */
  async bulkDeleteMessages(
    guildId: string,
    channelId: string,
    filter?: MessageFilter,
    options?: {
      batch_size?: number;
      delay_ms?: number;
      dry_run?: boolean;
      created_by?: string;
    },
  ): Promise<string> {
    const config: BulkOperationConfig = {
      id: `delete_messages_${Date.now()}`,
      type: BulkOperationType.DELETE_MESSAGES,
      guild_id: guildId,
      target_ids: [channelId],
      filters: filter,
      batch_size: options?.batch_size || 50,
      delay_between_batches: options?.delay_ms || 1000,
      max_retries: 3,
      dry_run: options?.dry_run || false,
      created_by: options?.created_by || "system",
      created_at: new Date(),
      options: options || {},
    };

    return await this.startOperation(config);
  }

  /**
   * Start a bulk member operation (kick/ban)
   */
  async bulkMemberAction(
    guildId: string,
    action: "kick" | "ban",
    memberIds?: string[],
    filter?: MemberFilter,
    options?: {
      reason?: string;
      delete_message_days?: number;
      batch_size?: number;
      delay_ms?: number;
      dry_run?: boolean;
      created_by?: string;
    },
  ): Promise<string> {
    const type =
      action === "kick"
        ? BulkOperationType.KICK_MEMBERS
        : BulkOperationType.BAN_MEMBERS;

    const config: BulkOperationConfig = {
      id: `${action}_members_${Date.now()}`,
      type,
      guild_id: guildId,
      target_ids: memberIds,
      filters: filter,
      batch_size: options?.batch_size || 10,
      delay_between_batches: options?.delay_ms || 2000,
      max_retries: 3,
      dry_run: options?.dry_run || false,
      created_by: options?.created_by || "system",
      created_at: new Date(),
      options: options || {},
    };

    return await this.startOperation(config);
  }

  /**
   * Start a bulk role operation
   */
  async bulkRoleOperation(
    guildId: string,
    action: "add" | "remove",
    roleId: string,
    memberIds?: string[],
    filter?: MemberFilter,
    options?: {
      reason?: string;
      batch_size?: number;
      delay_ms?: number;
      dry_run?: boolean;
      created_by?: string;
    },
  ): Promise<string> {
    const type =
      action === "add"
        ? BulkOperationType.ADD_ROLES
        : BulkOperationType.REMOVE_ROLES;

    const config: BulkOperationConfig = {
      id: `${action}_roles_${Date.now()}`,
      type,
      guild_id: guildId,
      target_ids: memberIds,
      filters: filter,
      batch_size: options?.batch_size || 15,
      delay_between_batches: options?.delay_ms || 1500,
      max_retries: 3,
      dry_run: options?.dry_run || false,
      created_by: options?.created_by || "system",
      created_at: new Date(),
      options: { ...options, role_id: roleId },
    };

    return await this.startOperation(config);
  }

  /**
   * Start a bulk DM operation
   */
  async bulkSendDMs(
    guildId: string,
    message: string,
    memberIds?: string[],
    filter?: MemberFilter,
    options?: {
      embed?: any;
      batch_size?: number;
      delay_ms?: number;
      dry_run?: boolean;
      created_by?: string;
    },
  ): Promise<string> {
    const config: BulkOperationConfig = {
      id: `send_dms_${Date.now()}`,
      type: BulkOperationType.SEND_DMS,
      guild_id: guildId,
      target_ids: memberIds,
      filters: filter,
      batch_size: options?.batch_size || 5, // Conservative for DMs
      delay_between_batches: options?.delay_ms || 3000,
      max_retries: 2,
      dry_run: options?.dry_run || false,
      created_by: options?.created_by || "system",
      created_at: new Date(),
      options: { ...options, message },
    };

    return await this.startOperation(config);
  }

  /**
   * Start a bulk operation
   */
  private async startOperation(config: BulkOperationConfig): Promise<string> {
    if (!this.client) {
      throw new Error("Bulk operations service not initialized");
    }

    const progress: OperationProgress = {
      operation_id: config.id,
      status: OperationStatus.PENDING,
      total_items: 0,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      current_batch: 0,
      total_batches: 0,
      started_at: new Date(),
      updated_at: new Date(),
      errors: [],
    };

    this.operations.set(config.id, progress);

    // Start operation in background
    const controller = new AbortController();
    this.runningOperations.set(config.id, { config, controller });

    // Don't await - run in background
    this.executeOperation(config, controller.signal)
      .catch((err) => {
        error(`Bulk operation ${config.id} failed: ${err}`);
        this.updateProgress(config.id, { status: OperationStatus.FAILED });
      })
      .finally(() => {
        this.runningOperations.delete(config.id);
      });

    return config.id;
  }

  /**
   * Execute a bulk operation
   */
  private async executeOperation(
    config: BulkOperationConfig,
    signal: AbortSignal,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      this.updateProgress(config.id, { status: OperationStatus.RUNNING });

      const guild = await this.client!.guilds.fetch(config.guild_id);
      if (!guild) {
        throw new Error(`Guild ${config.guild_id} not found`);
      }

      let items: any[] = [];

      // Get items to process based on operation type
      switch (config.type) {
        case BulkOperationType.DELETE_MESSAGES:
          items = await this.getMessagesToDelete(guild, config);
          break;
        case BulkOperationType.KICK_MEMBERS:
        case BulkOperationType.BAN_MEMBERS:
        case BulkOperationType.ADD_ROLES:
        case BulkOperationType.REMOVE_ROLES:
        case BulkOperationType.SEND_DMS:
          items = await this.getMembersToProcess(guild, config);
          break;
        default:
          throw new Error(`Unsupported operation type: ${config.type}`);
      }

      const totalBatches = Math.ceil(items.length / config.batch_size);

      this.updateProgress(config.id, {
        total_items: items.length,
        total_batches: totalBatches,
      });

      if (config.dry_run) {
        info(
          `DRY RUN: Would process ${items.length} items in ${totalBatches} batches`,
        );
        this.updateProgress(config.id, {
          status: OperationStatus.COMPLETED,
          processed_items: items.length,
          successful_items: items.length,
        });
        return;
      }

      // Process items in batches
      for (let i = 0; i < items.length; i += config.batch_size) {
        if (signal.aborted) {
          this.updateProgress(config.id, { status: OperationStatus.CANCELLED });
          return;
        }

        const batch = items.slice(i, i + config.batch_size);
        const batchNumber = Math.floor(i / config.batch_size) + 1;

        this.updateProgress(config.id, { current_batch: batchNumber });

        await this.processBatch(guild, config, batch);

        // Delay between batches
        if (i + config.batch_size < items.length) {
          await this.sleep(config.delay_between_batches);
        }
      }

      const duration = Date.now() - startTime;
      const progress = this.operations.get(config.id)!;

      this.updateProgress(config.id, {
        status: OperationStatus.COMPLETED,
        processed_items: progress.successful_items + progress.failed_items,
      });

      // Emit completion event
      this.emit("operation_completed", {
        operation_id: config.id,
        type: config.type,
        duration_ms: duration,
        successful_items: progress.successful_items,
        failed_items: progress.failed_items,
        total_items: progress.total_items,
      });
    } catch (err) {
      error(`Bulk operation ${config.id} execution failed: ${err}`);
      this.updateProgress(config.id, { status: OperationStatus.FAILED });
    }
  }

  /**
   * Process a batch of items
   */
  private async processBatch(
    guild: Guild,
    config: BulkOperationConfig,
    batch: any[],
  ): Promise<void> {
    const promises = batch.map(async (item) => {
      let retryCount = 0;

      while (retryCount < config.max_retries) {
        try {
          await this.processItem(guild, config, item);
          this.incrementSuccess(config.id);
          return;
        } catch (err) {
          retryCount++;
          if (retryCount >= config.max_retries) {
            this.incrementFailure(config.id, item.id || item, err);
            return;
          }

          // Wait before retry
          await this.sleep(1000 * retryCount);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Process a single item
   */
  private async processItem(
    guild: Guild,
    config: BulkOperationConfig,
    item: any,
  ): Promise<void> {
    switch (config.type) {
      case BulkOperationType.DELETE_MESSAGES:
        if (item.deletable) {
          await item.delete();
        }
        break;

      case BulkOperationType.KICK_MEMBERS:
        const memberToKick = await guild.members.fetch(item.id);
        if (memberToKick.kickable) {
          await memberToKick.kick(config.options?.reason || "Bulk operation");
        }
        break;

      case BulkOperationType.BAN_MEMBERS:
        const memberToBan = await guild.members.fetch(item.id);
        if (memberToBan.bannable) {
          await memberToBan.ban({
            reason: config.options?.reason || "Bulk operation",
            deleteMessageDays: config.options?.delete_message_days || 0,
          });
        }
        break;

      case BulkOperationType.ADD_ROLES:
        const memberToAddRole = await guild.members.fetch(item.id);
        const roleToAdd = guild.roles.cache.get(config.options?.role_id);
        if (roleToAdd && !memberToAddRole.roles.cache.has(roleToAdd.id)) {
          await memberToAddRole.roles.add(
            roleToAdd,
            config.options?.reason || "Bulk operation",
          );
        }
        break;

      case BulkOperationType.REMOVE_ROLES:
        const memberToRemoveRole = await guild.members.fetch(item.id);
        const roleToRemove = guild.roles.cache.get(config.options?.role_id);
        if (
          roleToRemove &&
          memberToRemoveRole.roles.cache.has(roleToRemove.id)
        ) {
          await memberToRemoveRole.roles.remove(
            roleToRemove,
            config.options?.reason || "Bulk operation",
          );
        }
        break;

      case BulkOperationType.SEND_DMS:
        const memberToDM = await guild.members.fetch(item.id);
        const dmOptions: any = { content: config.options?.message };
        if (config.options?.embed) {
          dmOptions.embeds = [config.options.embed];
        }
        await memberToDM.send(dmOptions);
        break;

      default:
        throw new Error(`Unsupported operation type: ${config.type}`);
    }
  }

  /**
   * Get messages to delete based on filter
   */
  private async getMessagesToDelete(
    guild: Guild,
    config: BulkOperationConfig,
  ): Promise<Message[]> {
    const channelId = config.target_ids![0];
    const channel = guild.channels.cache.get(channelId) as TextChannel;

    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} not found or not a text channel`);
    }

    const messages: Message[] = [];
    const filter = config.filters as MessageFilter;

    let lastMessageId: string | undefined;
    const limit = 100; // Discord API limit

    while (messages.length < 10000) {
      // Reasonable limit
      const fetchOptions: any = { limit };

      if (filter?.before) {
        fetchOptions.before = filter.before;
      } else if (lastMessageId) {
        fetchOptions.before = lastMessageId;
      }

      if (filter?.after) {
        fetchOptions.after = filter.after;
      }

      const fetched = (await channel.messages.fetch(
        fetchOptions,
      )) as unknown as Collection<string, Message>;
      if (fetched.size === 0) break;

      // Filter messages and convert to array - fetched is a Collection
      const messageArray = Array.from(fetched.values());
      const filteredMessages = messageArray.filter((message) =>
        this.matchesMessageFilter(message, filter),
      );
      messages.push(...filteredMessages);

      lastMessageId = messageArray[messageArray.length - 1]?.id;

      if (fetched.size < limit) break;
    }

    return messages.reverse(); // Process oldest first
  }

  /**
   * Get members to process based on filter
   */
  private async getMembersToProcess(
    guild: Guild,
    config: BulkOperationConfig,
  ): Promise<GuildMember[]> {
    if (config.target_ids && config.target_ids.length > 0) {
      // Use specific member IDs
      const members = await Promise.all(
        config.target_ids.map((id) =>
          guild.members.fetch(id).catch(() => null),
        ),
      );
      return members.filter((m) => m !== null) as GuildMember[];
    }

    // Use filter to find members
    const allMembers = await guild.members.fetch();
    const filter = config.filters as MemberFilter;

    if (!filter) {
      return Array.from(allMembers.values());
    }

    return Array.from(allMembers.values()).filter((member) =>
      this.matchesMemberFilter(member, filter),
    );
  }

  /**
   * Check if message matches filter criteria
   */
  private matchesMessageFilter(
    message: Message,
    filter?: MessageFilter,
  ): boolean {
    if (!filter) return true;

    if (filter.user_id && message.author.id !== filter.user_id) {
      return false;
    }

    if (filter.is_bot !== undefined && message.author.bot !== filter.is_bot) {
      return false;
    }

    if (filter.is_pinned !== undefined && message.pinned !== filter.is_pinned) {
      return false;
    }

    if (
      filter.has_attachments !== undefined &&
      message.attachments.size > 0 !== filter.has_attachments
    ) {
      return false;
    }

    if (
      filter.has_embeds !== undefined &&
      message.embeds.length > 0 !== filter.has_embeds
    ) {
      return false;
    }

    if (
      filter.content_contains &&
      !message.content
        .toLowerCase()
        .includes(filter.content_contains.toLowerCase())
    ) {
      return false;
    }

    if (filter.content_regex) {
      const regex = new RegExp(filter.content_regex, "i");
      if (!regex.test(message.content)) {
        return false;
      }
    }

    if (filter.older_than_days) {
      const cutoff = Date.now() - filter.older_than_days * 24 * 60 * 60 * 1000;
      if (message.createdTimestamp > cutoff) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if member matches filter criteria
   */
  private matchesMemberFilter(
    member: GuildMember,
    filter: MemberFilter,
  ): boolean {
    if (filter.is_bot !== undefined && member.user.bot !== filter.is_bot) {
      return false;
    }

    if (
      filter.no_avatar !== undefined &&
      !member.user.avatarURL() !== filter.no_avatar
    ) {
      return false;
    }

    if (
      filter.joined_before &&
      member.joinedAt &&
      member.joinedAt > filter.joined_before
    ) {
      return false;
    }

    if (
      filter.joined_after &&
      member.joinedAt &&
      member.joinedAt < filter.joined_after
    ) {
      return false;
    }

    if (filter.has_roles && filter.has_roles.length > 0) {
      const hasAllRoles = filter.has_roles.every((roleId) =>
        member.roles.cache.has(roleId),
      );
      if (!hasAllRoles) {
        return false;
      }
    }

    if (filter.missing_roles && filter.missing_roles.length > 0) {
      const hasSomeMissingRoles = filter.missing_roles.some(
        (roleId) => !member.roles.cache.has(roleId),
      );
      if (!hasSomeMissingRoles) {
        return false;
      }
    }

    if (
      filter.username_contains &&
      !member.user.username
        .toLowerCase()
        .includes(filter.username_contains.toLowerCase())
    ) {
      return false;
    }

    if (filter.username_regex) {
      const regex = new RegExp(filter.username_regex, "i");
      if (!regex.test(member.user.username)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update operation progress
   */
  private updateProgress(
    operationId: string,
    updates: Partial<OperationProgress>,
  ): void {
    const progress = this.operations.get(operationId);
    if (!progress) return;

    Object.assign(progress, updates);
    progress.updated_at = new Date();

    // Estimate completion time
    if (progress.processed_items > 0 && progress.total_items > 0) {
      const completionRate = progress.processed_items / progress.total_items;
      const elapsed = Date.now() - progress.started_at.getTime();
      const estimatedTotal = elapsed / completionRate;
      progress.estimated_completion = new Date(
        progress.started_at.getTime() + estimatedTotal,
      );
    }

    this.operations.set(operationId, progress);
    this.emit("progress_updated", progress);
  }

  /**
   * Increment success count
   */
  private incrementSuccess(operationId: string): void {
    const progress = this.operations.get(operationId);
    if (progress) {
      progress.successful_items++;
      progress.processed_items++;
      this.updateProgress(operationId, {});
    }
  }

  /**
   * Increment failure count
   */
  private incrementFailure(
    operationId: string,
    itemId: string,
    error: any,
  ): void {
    const progress = this.operations.get(operationId);
    if (progress) {
      progress.failed_items++;
      progress.processed_items++;
      progress.errors.push({
        item_id: itemId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
      this.updateProgress(operationId, {});
    }
  }

  /**
   * Get all operations
   */
  getAllOperations(): OperationProgress[] {
    return Array.from(this.operations.values());
  }

  /**
   * Cancel a running operation
   */
  cancelOperation(operationId: string): boolean {
    const running = this.runningOperations.get(operationId);
    if (running) {
      running.controller.abort();
      this.updateProgress(operationId, { status: OperationStatus.CANCELLED });
      return true;
    }
    return false;
  }

  /**
   * Clean up completed operations
   */
  cleanupOldOperations(olderThanHours: number = 24): void {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;

    for (const [id, progress] of this.operations.entries()) {
      if (
        progress.updated_at.getTime() < cutoff &&
        [
          OperationStatus.COMPLETED,
          OperationStatus.FAILED,
          OperationStatus.CANCELLED,
        ].includes(progress.status)
      ) {
        this.operations.delete(id);
      }
    }

    info(`Cleaned up old bulk operations (older than ${olderThanHours} hours)`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    // Cancel all running operations
    for (const [id, operation] of this.runningOperations.entries()) {
      operation.controller.abort();
      this.updateProgress(id, { status: OperationStatus.CANCELLED });
    }

    this.operations.clear();
    this.runningOperations.clear();

    info("Bulk operations service shutdown complete");
  }
}
