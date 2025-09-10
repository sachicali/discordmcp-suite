# MCP Discord Server - Tool Reference

## Authentication Tools

### `discord_login`

Authenticate the bot with Discord using a token.

**Parameters:**

```json
{
  "token": "string (required) - Discord bot token"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "bot_user_id",
    "username": "bot_username",
    "discriminator": "0000"
  },
  "guilds": 5
}
```

**Example:**

```typescript
await callTool("discord_login", {
  token: "MTIwMTk5NDAyMjcxODAyMTcyMw.Gtexy_.FfmL2NAc4vZGL...",
});
```

---

### `discord_logout`

Disconnect the bot from Discord.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "message": "Successfully logged out from Discord"
}
```

---

### `discord_set_token`

Set the Discord bot token without logging in immediately.

**Parameters:**

```json
{
  "token": "string (required) - Discord bot token"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Token set successfully"
}
```

---

### `discord_validate_token`

Validate a Discord bot token without logging in.

**Parameters:**

```json
{
  "token": "string (required) - Discord bot token to validate"
}
```

**Response:**

```json
{
  "valid": true,
  "user": {
    "id": "bot_user_id",
    "username": "bot_username"
  }
}
```

---

### `discord_login_status`

Check the current login status and connection details.

**Parameters:** None

**Response:**

```json
{
  "connected": true,
  "user": {
    "id": "bot_user_id",
    "username": "bot_username",
    "tag": "BotName#0000"
  },
  "guilds": 5,
  "uptime": 3600000
}
```

---

### `discord_health_check`

Comprehensive health check of the Discord bot and server.

**Parameters:** None

**Response:**

```json
{
  "status": "healthy",
  "discord": {
    "connected": true,
    "latency": 45,
    "guilds": 5,
    "channels": 127
  },
  "server": {
    "uptime": 3600000,
    "memory": {
      "used": "128 MB",
      "free": "384 MB"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Channel Management Tools

### `discord_create_text_channel`

Create a new text channel in a Discord server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "name": "string (required) - Channel name",
  "topic": "string (optional) - Channel topic/description",
  "category_id": "string (optional) - Parent category ID",
  "permission_overwrites": "array (optional) - Permission settings"
}
```

**Response:**

```json
{
  "success": true,
  "channel": {
    "id": "channel_id",
    "name": "channel-name",
    "type": "GUILD_TEXT",
    "guild_id": "guild_id",
    "position": 0,
    "topic": "Channel description",
    "category_id": "category_id"
  }
}
```

**Example:**

```typescript
await callTool("discord_create_text_channel", {
  guild_id: "1234567890123456789",
  name: "general-discussion",
  topic: "General chat for all members",
  category_id: "1234567890123456790",
});
```

---

### `discord_create_forum_channel`

Create a new forum channel for threaded discussions.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "name": "string (required) - Forum channel name",
  "topic": "string (optional) - Forum description",
  "category_id": "string (optional) - Parent category ID"
}
```

**Response:**

```json
{
  "success": true,
  "channel": {
    "id": "channel_id",
    "name": "forum-name",
    "type": "GUILD_FORUM",
    "guild_id": "guild_id",
    "topic": "Forum description"
  }
}
```

---

### `discord_edit_channel`

Modify properties of an existing channel.

**Parameters:**

```json
{
  "channel_id": "string (required) - Channel ID to edit",
  "name": "string (optional) - New channel name",
  "topic": "string (optional) - New topic/description",
  "category_id": "string (optional) - New parent category",
  "position": "number (optional) - Channel position",
  "rate_limit_per_user": "number (optional) - Slowmode seconds"
}
```

**Response:**

```json
{
  "success": true,
  "channel": {
    "id": "channel_id",
    "name": "updated-name",
    "topic": "Updated description",
    "rate_limit_per_user": 5
  }
}
```

---

### `discord_delete_channel`

Delete a channel permanently.

**Parameters:**

```json
{
  "channel_id": "string (required) - Channel ID to delete",
  "reason": "string (optional) - Reason for deletion"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Channel deleted successfully",
  "deleted_channel": {
    "id": "channel_id",
    "name": "deleted-channel"
  }
}
```

---

### `discord_create_category`

Create a new channel category for organization.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "name": "string (required) - Category name",
  "position": "number (optional) - Category position"
}
```

**Response:**

```json
{
  "success": true,
  "category": {
    "id": "category_id",
    "name": "Category Name",
    "type": "GUILD_CATEGORY",
    "position": 0
  }
}
```

---

## Message Management Tools

### `discord_send`

Send a message to a Discord channel.

**Parameters:**

```json
{
  "channel_id": "string (optional) - Channel ID",
  "channel_name": "string (optional) - Channel name",
  "guild_id": "string (required if using channel_name) - Server ID",
  "message": "string (required) - Message content",
  "embed": "object (optional) - Rich embed object",
  "components": "array (optional) - Interactive components"
}
```

**Response:**

```json
{
  "success": true,
  "message": {
    "id": "message_id",
    "content": "Message content",
    "channel_id": "channel_id",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Example with Embed:**

```typescript
await callTool("discord_send", {
  channel_id: "1234567890123456789",
  message: "Check out this announcement!",
  embed: {
    title: "Server Update",
    description: "New features have been added!",
    color: 0x00ff00,
    fields: [
      {
        name: "Feature 1",
        value: "Description of feature 1",
        inline: true,
      },
    ],
  },
});
```

---

### `discord_read_messages`

Retrieve messages from a channel with pagination support.

**Parameters:**

```json
{
  "channel_id": "string (optional) - Channel ID",
  "channel_name": "string (optional) - Channel name",
  "guild_id": "string (required if using channel_name) - Server ID",
  "limit": "number (optional, max 100) - Number of messages to retrieve",
  "before": "string (optional) - Message ID to fetch messages before",
  "after": "string (optional) - Message ID to fetch messages after"
}
```

**Response:**

```json
{
  "success": true,
  "messages": [
    {
      "id": "message_id",
      "content": "Message content",
      "author": {
        "id": "user_id",
        "username": "username",
        "discriminator": "1234"
      },
      "timestamp": "2024-01-15T10:30:00Z",
      "edited_timestamp": null,
      "reactions": []
    }
  ],
  "channel": {
    "id": "channel_id",
    "name": "channel-name"
  }
}
```

---

### `discord_delete_message`

Delete a specific message.

**Parameters:**

```json
{
  "message_id": "string (required) - Message ID to delete",
  "channel_id": "string (required) - Channel ID containing the message",
  "reason": "string (optional) - Reason for deletion"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

## Reaction Tools

### `discord_add_reaction`

Add a single reaction to a message.

**Parameters:**

```json
{
  "message_id": "string (required) - Message ID",
  "channel_id": "string (required) - Channel ID",
  "emoji": "string (required) - Emoji (Unicode or custom :name:id)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reaction added successfully",
  "emoji": "👍"
}
```

**Example:**

```typescript
// Unicode emoji
await callTool("discord_add_reaction", {
  message_id: "1234567890123456789",
  channel_id: "1234567890123456790",
  emoji: "👍",
});

// Custom emoji
await callTool("discord_add_reaction", {
  message_id: "1234567890123456789",
  channel_id: "1234567890123456790",
  emoji: "custom_name:1234567890123456791",
});
```

---

### `discord_add_multiple_reactions`

Add multiple reactions to a message at once.

**Parameters:**

```json
{
  "message_id": "string (required) - Message ID",
  "channel_id": "string (required) - Channel ID",
  "emojis": "array (required) - Array of emoji strings"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Multiple reactions added successfully",
  "added_reactions": ["👍", "❤️", "🎉"],
  "failed_reactions": []
}
```

---

### `discord_remove_reaction`

Remove a reaction from a message.

**Parameters:**

```json
{
  "message_id": "string (required) - Message ID",
  "channel_id": "string (required) - Channel ID",
  "emoji": "string (required) - Emoji to remove",
  "user_id": "string (optional) - Specific user's reaction to remove"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reaction removed successfully"
}
```

---

## User Management Tools

### `discord_get_user_info`

Get detailed information about a Discord user.

**Parameters:**

```json
{
  "user_id": "string (required) - Discord user ID"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "username",
    "discriminator": "1234",
    "avatar": "avatar_hash",
    "bot": false,
    "system": false,
    "public_flags": 0,
    "created_at": "2020-01-15T10:30:00Z"
  }
}
```

---

### `discord_get_guild_member`

Get guild-specific member information.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "user_id": "string (required) - Discord user ID"
}
```

**Response:**

```json
{
  "success": true,
  "member": {
    "user": {
      "id": "user_id",
      "username": "username",
      "discriminator": "1234"
    },
    "nick": "Nickname",
    "roles": ["role_id_1", "role_id_2"],
    "joined_at": "2023-01-15T10:30:00Z",
    "premium_since": null,
    "permissions": "8",
    "communicationDisabledUntil": null
  }
}
```

---

### `discord_list_guild_members`

List members of a Discord server with pagination.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "limit": "number (optional, max 1000) - Number of members to return",
  "after": "string (optional) - User ID to start after"
}
```

**Response:**

```json
{
  "success": true,
  "members": [
    {
      "user": {
        "id": "user_id",
        "username": "username",
        "discriminator": "1234"
      },
      "nick": "Nickname",
      "roles": ["role_id_1"],
      "joined_at": "2023-01-15T10:30:00Z"
    }
  ],
  "total_members": 1337,
  "pagination": {
    "has_more": true,
    "last_user_id": "last_user_id"
  }
}
```

---

### `discord_add_role_to_member`

Add a role to a guild member.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "user_id": "string (required) - Discord user ID",
  "role_id": "string (required) - Role ID to add",
  "reason": "string (optional) - Reason for role addition"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Role added successfully",
  "member": "username#1234",
  "role": "Role Name"
}
```

---

### `discord_remove_role_from_member`

Remove a role from a guild member.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "user_id": "string (required) - Discord user ID",
  "role_id": "string (required) - Role ID to remove",
  "reason": "string (optional) - Reason for role removal"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Role removed successfully",
  "member": "username#1234",
  "role": "Role Name"
}
```

---

### `discord_kick_member`

Remove a member from the server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "user_id": "string (required) - Discord user ID to kick",
  "reason": "string (optional) - Reason for kick"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Member kicked successfully",
  "member": "username#1234"
}
```

---

### `discord_ban_member`

Ban a member from the server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "user_id": "string (required) - Discord user ID to ban",
  "delete_message_days": "number (optional, 0-7) - Days of messages to delete",
  "reason": "string (optional) - Reason for ban"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Member banned successfully",
  "member": "username#1234"
}
```

---

### `discord_unban_member`

Remove a ban from a user.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "user_id": "string (required) - Discord user ID to unban",
  "reason": "string (optional) - Reason for unban"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Member unbanned successfully",
  "user_id": "user_id"
}
```

---

### `discord_timeout_member`

Apply a timeout to a member (temporary restriction).

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "user_id": "string (required) - Discord user ID",
  "duration_minutes": "number (required, max 40320) - Timeout duration in minutes",
  "reason": "string (optional) - Reason for timeout"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Member timeout applied successfully",
  "member": "username#1234",
  "until": "2024-01-15T11:30:00Z"
}
```

---

## Role Management Tools

### `discord_create_role`

Create a new role in the server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "name": "string (required) - Role name",
  "color": "number (optional) - Role color as hex number",
  "hoist": "boolean (optional) - Display separately in member list",
  "mentionable": "boolean (optional) - Allow role to be mentioned",
  "permissions": "string (optional) - Permission bitfield string",
  "icon": "string (optional) - Role icon URL",
  "reason": "string (optional) - Reason for role creation"
}
```

**Response:**

```json
{
  "success": true,
  "role": {
    "id": "role_id",
    "name": "Role Name",
    "color": 16711680,
    "hoist": true,
    "position": 1,
    "permissions": "8",
    "mentionable": true,
    "managed": false
  }
}
```

---

### `discord_edit_role`

Modify an existing role.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "role_id": "string (required) - Role ID to edit",
  "name": "string (optional) - New role name",
  "color": "number (optional) - New role color",
  "hoist": "boolean (optional) - Display separately in member list",
  "mentionable": "boolean (optional) - Allow role to be mentioned",
  "permissions": "string (optional) - New permission bitfield",
  "reason": "string (optional) - Reason for role edit"
}
```

**Response:**

```json
{
  "success": true,
  "role": {
    "id": "role_id",
    "name": "Updated Role Name",
    "color": 65535,
    "permissions": "8"
  }
}
```

---

### `discord_delete_role`

Delete a role from the server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "role_id": "string (required) - Role ID to delete",
  "reason": "string (optional) - Reason for role deletion"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Role deleted successfully",
  "deleted_role": {
    "id": "role_id",
    "name": "Deleted Role"
  }
}
```

---

### `discord_list_roles`

List all roles in the server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID"
}
```

**Response:**

```json
{
  "success": true,
  "roles": [
    {
      "id": "role_id",
      "name": "Role Name",
      "color": 16711680,
      "hoist": true,
      "position": 1,
      "permissions": "8",
      "mentionable": true,
      "member_count": 42
    }
  ],
  "total_roles": 5
}
```

---

### `discord_get_role_permissions`

Get detailed permission information for a role.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "role_id": "string (required) - Role ID to inspect"
}
```

**Response:**

```json
{
  "success": true,
  "role": {
    "id": "role_id",
    "name": "Role Name",
    "permissions": "8",
    "permission_list": ["Administrator", "Manage Server", "Manage Channels"],
    "dangerous_permissions": ["Administrator"]
  }
}
```

---

## Webhook Tools

### `discord_create_webhook`

Create a new webhook in a channel.

**Parameters:**

```json
{
  "channel_id": "string (required) - Channel ID",
  "name": "string (required) - Webhook name",
  "avatar": "string (optional) - Webhook avatar URL",
  "reason": "string (optional) - Reason for webhook creation"
}
```

**Response:**

```json
{
  "success": true,
  "webhook": {
    "id": "webhook_id",
    "name": "Webhook Name",
    "channel_id": "channel_id",
    "url": "https://discord.com/api/webhooks/webhook_id/webhook_token",
    "token": "webhook_token"
  }
}
```

---

### `discord_send_webhook_message`

Send a message through a webhook.

**Parameters:**

```json
{
  "webhook_url": "string (required) - Complete webhook URL",
  "content": "string (optional) - Message content",
  "username": "string (optional) - Override webhook username",
  "avatar_url": "string (optional) - Override webhook avatar",
  "embeds": "array (optional) - Array of embed objects",
  "tts": "boolean (optional) - Text-to-speech message"
}
```

**Response:**

```json
{
  "success": true,
  "message": {
    "id": "message_id",
    "content": "Message content",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### `discord_edit_webhook`

Modify an existing webhook.

**Parameters:**

```json
{
  "webhook_id": "string (required) - Webhook ID",
  "name": "string (optional) - New webhook name",
  "avatar": "string (optional) - New webhook avatar URL",
  "channel_id": "string (optional) - Move to different channel",
  "reason": "string (optional) - Reason for webhook edit"
}
```

**Response:**

```json
{
  "success": true,
  "webhook": {
    "id": "webhook_id",
    "name": "Updated Webhook Name",
    "channel_id": "channel_id"
  }
}
```

---

### `discord_delete_webhook`

Delete a webhook.

**Parameters:**

```json
{
  "webhook_id": "string (required) - Webhook ID",
  "reason": "string (optional) - Reason for webhook deletion"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

---

### `discord_list_webhooks`

List all webhooks in a channel or server.

**Parameters:**

```json
{
  "guild_id": "string (optional) - Discord server ID",
  "channel_id": "string (optional) - Channel ID"
}
```

**Response:**

```json
{
  "success": true,
  "webhooks": [
    {
      "id": "webhook_id",
      "name": "Webhook Name",
      "channel_id": "channel_id",
      "user": {
        "id": "creator_id",
        "username": "creator_name"
      }
    }
  ],
  "total_webhooks": 3
}
```

---

## Forum Tools

### `discord_get_forum_channels`

List all forum channels in a server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID"
}
```

**Response:**

```json
{
  "success": true,
  "forums": [
    {
      "id": "channel_id",
      "name": "forum-name",
      "topic": "Forum description",
      "position": 0,
      "active_threads": 12,
      "archived_threads": 45
    }
  ],
  "total_forums": 3
}
```

---

### `discord_create_forum_post`

Create a new forum post (thread).

**Parameters:**

```json
{
  "channel_id": "string (required) - Forum channel ID",
  "title": "string (required) - Forum post title",
  "message": "string (required) - Initial message content",
  "auto_archive_duration": "number (optional) - Auto-archive time in minutes"
}
```

**Response:**

```json
{
  "success": true,
  "thread": {
    "id": "thread_id",
    "name": "Forum Post Title",
    "parent_id": "forum_channel_id",
    "owner_id": "bot_user_id"
  },
  "message": {
    "id": "message_id",
    "content": "Initial message content"
  }
}
```

---

### `discord_get_forum_post`

Retrieve a specific forum post and its messages.

**Parameters:**

```json
{
  "thread_id": "string (required) - Forum thread ID",
  "limit": "number (optional, max 100) - Number of messages to retrieve"
}
```

**Response:**

```json
{
  "success": true,
  "thread": {
    "id": "thread_id",
    "name": "Forum Post Title",
    "parent_id": "forum_channel_id",
    "created_at": "2024-01-15T10:30:00Z",
    "archived": false
  },
  "messages": [
    {
      "id": "message_id",
      "content": "Message content",
      "author": {
        "id": "user_id",
        "username": "username"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### `discord_reply_to_forum`

Reply to a forum post thread.

**Parameters:**

```json
{
  "thread_id": "string (required) - Forum thread ID",
  "message": "string (required) - Reply message content",
  "embed": "object (optional) - Rich embed object"
}
```

**Response:**

```json
{
  "success": true,
  "message": {
    "id": "message_id",
    "content": "Reply message content",
    "thread_id": "thread_id",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### `discord_delete_forum_post`

Delete a forum post thread.

**Parameters:**

```json
{
  "thread_id": "string (required) - Forum thread ID to delete",
  "reason": "string (optional) - Reason for deletion"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Forum post deleted successfully",
  "deleted_thread": {
    "id": "thread_id",
    "name": "Deleted Forum Post"
  }
}
```

---

## Server Management Tools

### `discord_list_servers`

List all servers the bot has access to.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "servers": [
    {
      "id": "guild_id",
      "name": "Server Name",
      "icon": "icon_hash",
      "owner": true,
      "permissions": "8",
      "member_count": 1337,
      "premium_tier": 2
    }
  ],
  "total_servers": 5
}
```

---

### `discord_get_server_info`

Get detailed information about a specific server.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID"
}
```

**Response:**

```json
{
  "success": true,
  "server": {
    "id": "guild_id",
    "name": "Server Name",
    "description": "Server description",
    "icon": "icon_hash",
    "splash": "splash_hash",
    "banner": "banner_hash",
    "owner_id": "owner_user_id",
    "region": "us-east",
    "afk_channel_id": "afk_channel_id",
    "afk_timeout": 300,
    "verification_level": 2,
    "default_message_notifications": 0,
    "explicit_content_filter": 2,
    "mfa_level": 1,
    "premium_tier": 2,
    "premium_subscription_count": 15,
    "preferred_locale": "en-US",
    "created_at": "2020-01-15T10:30:00Z"
  },
  "features": ["COMMUNITY", "NEWS", "WELCOME_SCREEN_ENABLED"],
  "channels": 47,
  "roles": 12,
  "members": 1337,
  "emojis": 25,
  "stickers": 5
}
```

---

### `discord_update_server_settings`

Update basic server settings.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "name": "string (optional) - New server name",
  "description": "string (optional) - New server description",
  "icon": "string (optional) - New server icon URL",
  "banner": "string (optional) - New server banner URL",
  "splash": "string (optional) - New invite splash URL",
  "region": "string (optional) - Voice region",
  "afk_channel_id": "string (optional) - AFK channel ID",
  "afk_timeout": "number (optional) - AFK timeout in seconds",
  "verification_level": "number (optional) - Verification level (0-4)",
  "default_message_notifications": "number (optional) - Default notification level",
  "explicit_content_filter": "number (optional) - Content filter level",
  "reason": "string (optional) - Reason for changes"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Server settings updated successfully",
  "updated_fields": ["name", "description", "verification_level"]
}
```

---

### `discord_update_welcome_screen`

Configure the server welcome screen.

**Parameters:**

```json
{
  "guild_id": "string (required) - Discord server ID",
  "enabled": "boolean (optional) - Enable/disable welcome screen",
  "description": "string (optional) - Welcome description",
  "welcome_channels": "array (optional) - Array of welcome channel objects"
}
```

**Welcome Channel Object:**

```json
{
  "channel_id": "string (required) - Channel ID",
  "description": "string (required) - Channel description",
  "emoji_id": "string (optional) - Custom emoji ID",
  "emoji_name": "string (optional) - Emoji name or Unicode"
}
```

**Response:**

```json
{
  "success": true,
  "welcome_screen": {
    "enabled": true,
    "description": "Welcome to our server!",
    "welcome_channels": [
      {
        "channel_id": "channel_id",
        "description": "General chat",
        "emoji_name": "💬"
      }
    ]
  }
}
```

---

## Direct Message Tools

### `discord_send_direct_message`

Send a direct message to a user.

**Parameters:**

```json
{
  "user_id": "string (required) - Discord user ID",
  "message": "string (required) - Message content",
  "embed": "object (optional) - Rich embed object"
}
```

**Response:**

```json
{
  "success": true,
  "message": {
    "id": "message_id",
    "content": "Direct message content",
    "channel_id": "dm_channel_id",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "recipient": {
    "id": "user_id",
    "username": "username",
    "discriminator": "1234"
  }
}
```

---

### `discord_get_direct_messages`

Retrieve direct messages with a user.

**Parameters:**

```json
{
  "user_id": "string (required) - Discord user ID",
  "limit": "number (optional, max 100) - Number of messages to retrieve",
  "before": "string (optional) - Message ID to fetch messages before",
  "after": "string (optional) - Message ID to fetch messages after"
}
```

**Response:**

```json
{
  "success": true,
  "messages": [
    {
      "id": "message_id",
      "content": "Direct message content",
      "author": {
        "id": "user_id",
        "username": "username",
        "discriminator": "1234"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "dm_channel": {
    "id": "dm_channel_id",
    "type": "DM"
  },
  "total_messages": 25
}
```

---

## Error Responses

All tools may return error responses in the following format:

```json
{
  "success": false,
  "error": {
    "code": "MISSING_PERMISSIONS",
    "message": "Bot lacks required permissions for this operation",
    "details": {
      "required_permissions": ["MANAGE_CHANNELS"],
      "missing_permissions": ["MANAGE_CHANNELS"]
    },
    "suggestion": "Grant the bot Manage Channels permission"
  }
}
```

Common error codes:

- `MISSING_PERMISSIONS` - Bot lacks required permissions
- `UNKNOWN_GUILD` - Server not found or bot not member
- `UNKNOWN_CHANNEL` - Channel not found or no access
- `UNKNOWN_USER` - User not found
- `RATE_LIMITED` - Too many requests, retry later
- `INVALID_TOKEN` - Bot token is invalid
- `NETWORK_ERROR` - Connection or API issue

## Rate Limiting

The server implements intelligent rate limiting to prevent Discord API abuse:

- **Automatic backoff** for rate limit responses
- **Request queuing** for bulk operations
- **Circuit breaker** protection for failing endpoints
- **Exponential retry** with jitter

Monitor rate limit headers and adjust request frequency accordingly.

## Best Practices

### Performance

- Use bulk operations when available
- Implement proper pagination for large datasets
- Cache frequently accessed data
- Monitor API quotas and limits

### Security

- Validate all input parameters
- Use least-privilege permissions
- Implement audit logging
- Restrict bot to specific guilds/channels in production

### Error Handling

- Always check response success status
- Implement retry logic for transient failures
- Log errors for monitoring and debugging
- Provide meaningful error messages to users

### Monitoring

- Track API usage and performance metrics
- Monitor error rates and patterns
- Set up alerts for service degradation
- Use health checks for deployment validation
