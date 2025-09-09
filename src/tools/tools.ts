import { Client } from "discord.js";
import { z } from "zod";
import { ToolResponse, ToolContext, ToolHandler } from "./types.js";
import { loginHandler } from "./login.js";
import { sendMessageHandler } from "./send-message.js";
import {
  getForumChannelsHandler,
  createForumPostHandler,
  getForumPostHandler,
  replyToForumHandler,
  deleteForumPostHandler,
} from "./forum.js";
import {
  createTextChannelHandler,
  createForumChannelHandler,
  editChannelHandler,
  deleteChannelHandler,
  readMessagesHandler,
  getServerInfoHandler,
  createCategoryHandler,
  editCategoryHandler,
  deleteCategoryHandler,
  listServersHandler,
  createChannelUnderCategoryHandler,
  moveChannelToCategoryHandler,
  updateServerSettingsHandler,
  updateServerEngagementHandler,
  updateWelcomeScreenHandler,
  createEmojiHandler,
  deleteEmojiHandler,
  listEmojisHandler,
  createStickerHandler,
  deleteStickerHandler,
  listStickersHandler,
  createInviteHandler,
  deleteInviteHandler,
  listInvitesHandler,
  listIntegrationsHandler,
  deleteIntegrationHandler,
  createSoundboardSoundHandler,
  deleteSoundboardSoundHandler,
  listSoundboardSoundsHandler,
} from "./channel.js";
import {
  addReactionHandler,
  addMultipleReactionsHandler,
  removeReactionHandler,
  deleteMessageHandler,
} from "./reactions.js";
import {
  createWebhookHandler,
  sendWebhookMessageHandler,
  editWebhookHandler,
  deleteWebhookHandler,
} from "./webhooks.js";
import {
  getUserInfoHandler,
  getGuildMemberHandler,
  listGuildMembersHandler,
  addRoleToMemberHandler,
  removeRoleFromMemberHandler,
  kickMemberHandler,
  banMemberHandler,
  unbanMemberHandler,
  timeoutMemberHandler,
  createRoleHandler,
  editRoleHandler,
  deleteRoleHandler,
  listRolesHandler,
  getRolePermissionsHandler,
} from "./user.js";
import { sendDirectMessageHandler, getDirectMessagesHandler } from "./dm.js";

// Export tool handlers
export {
  loginHandler,
  sendMessageHandler,
  getForumChannelsHandler,
  createForumPostHandler,
  getForumPostHandler,
  replyToForumHandler,
  deleteForumPostHandler,
  createTextChannelHandler,
  createForumChannelHandler,
  editChannelHandler,
  deleteChannelHandler,
  readMessagesHandler,
  getServerInfoHandler,
  listServersHandler,
  createChannelUnderCategoryHandler,
  moveChannelToCategoryHandler,
  updateServerSettingsHandler,
  updateServerEngagementHandler,
  updateWelcomeScreenHandler,
  createEmojiHandler,
  deleteEmojiHandler,
  listEmojisHandler,
  createStickerHandler,
  deleteStickerHandler,
  listStickersHandler,
  createInviteHandler,
  deleteInviteHandler,
  listInvitesHandler,
  listIntegrationsHandler,
  deleteIntegrationHandler,
  createSoundboardSoundHandler,
  deleteSoundboardSoundHandler,
  listSoundboardSoundsHandler,
  addReactionHandler,
  addMultipleReactionsHandler,
  removeReactionHandler,
  deleteMessageHandler,
  createWebhookHandler,
  sendWebhookMessageHandler,
  editWebhookHandler,
  deleteWebhookHandler,
  createCategoryHandler,
  editCategoryHandler,
  deleteCategoryHandler,
  getUserInfoHandler,
  getGuildMemberHandler,
  listGuildMembersHandler,
  addRoleToMemberHandler,
  removeRoleFromMemberHandler,
  kickMemberHandler,
  banMemberHandler,
  unbanMemberHandler,
  timeoutMemberHandler,
  createRoleHandler,
  editRoleHandler,
  deleteRoleHandler,
  listRolesHandler,
  getRolePermissionsHandler,
  sendDirectMessageHandler,
  getDirectMessagesHandler,
};

// Export common types
export { ToolResponse, ToolContext, ToolHandler };

// Create tool context
export function createToolContext(client: Client): ToolContext {
  return { client };
}
