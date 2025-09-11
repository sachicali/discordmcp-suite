import { info, error } from "./logger.js";

// Import all tool handlers
import {
  createToolContext,
  loginHandler,
  setTokenHandler,
  validateTokenHandler,
  loginStatusHandler,
  logoutHandler,
  updateConfigHandler,
  healthCheckHandler,
  listServersHandler,
  sendMessageHandler,
  getForumChannelsHandler,
  createForumPostHandler,
  getForumPostHandler,
  replyToForumHandler,
  deleteForumPostHandler,
  createTextChannelHandler,
  deleteChannelHandler,
  readMessagesHandler,
  getServerInfoHandler,
  addReactionHandler,
  addMultipleReactionsHandler,
  removeReactionHandler,
  deleteMessageHandler,
  createWebhookHandler,
  sendWebhookMessageHandler,
  editWebhookHandler,
  deleteWebhookHandler,
  editCategoryHandler,
  createCategoryHandler,
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
  createVoiceChannelHandler,
  deleteVoiceChannelHandler,
  editVoiceChannelHandler,
  listVoiceChannelsHandler,
  getVoiceChannelInfoHandler,
  createForumChannelHandler,
  createChannelUnderCategoryHandler,
  moveChannelToCategoryHandler,
  editChannelHandler,
  listWebhooksHandler,
} from "./tools/tools.js";

// Create a mapping of tool names to their handlers
const toolHandlerMap: Record<string, Function> = {
  // Authentication tools
  "discord_login": loginHandler,
  "discord_set_token": setTokenHandler,
  "discord_validate_token": validateTokenHandler,
  "discord_login_status": loginStatusHandler,
  "discord_logout": logoutHandler,
  "discord_update_config": updateConfigHandler,
  "discord_health_check": healthCheckHandler,
  
  // Server tools
  "discord_list_servers": listServersHandler,
  "discord_get_server_info": getServerInfoHandler,
  "discord_update_server_settings": updateServerSettingsHandler,
  "discord_update_server_engagement": updateServerEngagementHandler,
  "discord_update_welcome_screen": updateWelcomeScreenHandler,
  
  // Channel tools
  "discord_send": sendMessageHandler,
  "discord_create_text_channel": createTextChannelHandler,
  "discord_create_forum_channel": createForumChannelHandler,
  "discord_edit_channel": editChannelHandler,
  "discord_delete_channel": deleteChannelHandler,
  "discord_create_channel_under_category": createChannelUnderCategoryHandler,
  "discord_move_channel_to_category": moveChannelToCategoryHandler,
  
  // Forum tools
  "discord_get_forum_channels": getForumChannelsHandler,
  "discord_create_forum_post": createForumPostHandler,
  "discord_get_forum_post": getForumPostHandler,
  "discord_reply_to_forum": replyToForumHandler,
  "discord_delete_forum_post": deleteForumPostHandler,
  
  // Message tools
  "discord_read_messages": readMessagesHandler,
  "discord_delete_message": deleteMessageHandler,
  
  // Reaction tools
  "discord_add_reaction": addReactionHandler,
  "discord_add_multiple_reactions": addMultipleReactionsHandler,
  "discord_remove_reaction": removeReactionHandler,
  
  // Webhook tools
  "discord_create_webhook": createWebhookHandler,
  "discord_send_webhook_message": sendWebhookMessageHandler,
  "discord_edit_webhook": editWebhookHandler,
  "discord_delete_webhook": deleteWebhookHandler,
  "discord_list_webhooks": listWebhooksHandler,
  
  // Category tools
  "discord_create_category": createCategoryHandler,
  "discord_edit_category": editCategoryHandler,
  "discord_delete_category": deleteCategoryHandler,
  
  // User management tools
  "discord_get_user_info": getUserInfoHandler,
  "discord_get_guild_member": getGuildMemberHandler,
  "discord_list_guild_members": listGuildMembersHandler,
  "discord_add_role_to_member": addRoleToMemberHandler,
  "discord_remove_role_from_member": removeRoleFromMemberHandler,
  "discord_kick_member": kickMemberHandler,
  "discord_ban_member": banMemberHandler,
  "discord_unban_member": unbanMemberHandler,
  "discord_timeout_member": timeoutMemberHandler,
  
  // Role management tools
  "discord_create_role": createRoleHandler,
  "discord_edit_role": editRoleHandler,
  "discord_delete_role": deleteRoleHandler,
  "discord_list_roles": listRolesHandler,
  "discord_get_role_permissions": getRolePermissionsHandler,
  
  // Direct message tools
  "discord_send_direct_message": sendDirectMessageHandler,
  "discord_get_direct_messages": getDirectMessagesHandler,
  
  // Emoji and sticker tools
  "discord_create_emoji": createEmojiHandler,
  "discord_delete_emoji": deleteEmojiHandler,
  "discord_list_emojis": listEmojisHandler,
  "discord_create_sticker": createStickerHandler,
  "discord_delete_sticker": deleteStickerHandler,
  "discord_list_stickers": listStickersHandler,
  
  // Invite and integration tools
  "discord_create_invite": createInviteHandler,
  "discord_delete_invite": deleteInviteHandler,
  "discord_list_invites": listInvitesHandler,
  "discord_list_integrations": listIntegrationsHandler,
  "discord_delete_integration": deleteIntegrationHandler,
  
  // Soundboard tools
  "discord_create_soundboard_sound": createSoundboardSoundHandler,
  "discord_delete_soundboard_sound": deleteSoundboardSoundHandler,
  "discord_list_soundboard_sounds": listSoundboardSoundsHandler,
  
  // Voice channel tools
  "discord_create_voice_channel": createVoiceChannelHandler,
  "discord_delete_voice_channel": deleteVoiceChannelHandler,
  "discord_edit_voice_channel": editVoiceChannelHandler,
  "discord_list_voice_channels": listVoiceChannelsHandler,
  "discord_get_voice_channel_info": getVoiceChannelInfoHandler,
};

// Unified tool handler that eliminates duplication
export async function handleToolCall(
  toolName: string,
  params: any,
  toolContext: ReturnType<typeof createToolContext>
) {
  // Check if tool exists
  if (!toolHandlerMap[toolName]) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  // Call the appropriate handler
  return await toolHandlerMap[toolName](params, toolContext);
}

// Export the tool handler map for use in other modules
export { toolHandlerMap };