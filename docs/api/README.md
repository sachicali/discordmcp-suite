# MCP Discord Server - API Documentation

## Overview

Discord MCP server with 70+ tools for community management

## Quick Start

### Installation

```bash
# NPM
npm install -g mcp-discord

# Or run directly
npx mcp-discord

# Docker
docker run -p 3000:3000 -e DISCORD_TOKEN=your_token mcp-discord:latest
```

### Configuration

```bash
# Required
export DISCORD_TOKEN="your_discord_bot_token"

# Optional - Security
export ALLOW_GUILD_IDS="guild_id_1,guild_id_2"
export ALLOW_CHANNEL_IDS="channel_id_1,channel_id_2"

# Optional - Transport
export TRANSPORT="http"  # or "stdio"
export HTTP_PORT="3000"
```

## Tool Categories

### 🔐 Authentication & Configuration (7 tools)

- `discord_login` - Authenticate with Discord
- `discord_logout` - Disconnect from Discord
- `discord_set_token` - Set authentication token
- `discord_validate_token` - Validate token
- `discord_login_status` - Check connection status
- `discord_update_config` - Update server configuration
- `discord_health_check` - Server health monitoring

### 📺 Channel Management (13 tools)

- `discord_create_text_channel` - Create text channels
- `discord_create_forum_channel` - Create forum channels
- `discord_edit_channel` - Modify channel properties
- `discord_delete_channel` - Remove channels
- `discord_create_category` - Create channel categories
- `discord_edit_category` - Modify categories
- `discord_delete_category` - Remove categories
- `discord_create_channel_under_category` - Create organized channels
- `discord_move_channel_to_category` - Reorganize channels
- `discord_read_messages` - Retrieve channel messages
- `discord_send` - Send messages to channels
- `discord_delete_message` - Remove messages
- `discord_get_server_info` - Get channel and server information

### 🗣️ Forum Functions (5 tools)

- `discord_get_forum_channels` - List forum channels
- `discord_create_forum_post` - Create forum discussions
- `discord_get_forum_post` - Retrieve forum content
- `discord_reply_to_forum` - Respond to forum posts
- `discord_delete_forum_post` - Remove forum content

### 💬 Message & Reaction Management (5 tools)

- `discord_add_reaction` - Add single reactions
- `discord_add_multiple_reactions` - Add multiple reactions
- `discord_remove_reaction` - Remove reactions
- `discord_delete_message` - Delete messages
- `discord_send` - Send formatted messages

### 🎣 Webhook Management (5 tools)

- `discord_create_webhook` - Create webhooks
- `discord_send_webhook_message` - Send via webhook
- `discord_edit_webhook` - Modify webhooks
- `discord_delete_webhook` - Remove webhooks
- `discord_list_webhooks` - List all webhooks

### 🏢 Server Management (9 tools)

- `discord_list_servers` - List accessible servers
- `discord_update_server_settings` - Modify server properties
- `discord_update_server_engagement` - Configure engagement features
- `discord_update_welcome_screen` - Setup welcome experience
- `discord_create_emoji` - Add custom emojis
- `discord_delete_emoji` - Remove emojis
- `discord_list_emojis` - List server emojis
- `discord_create_sticker` - Add custom stickers
- `discord_delete_sticker` - Remove stickers
- `discord_list_stickers` - List server stickers

### 👥 User Management (8 tools)

- `discord_get_user_info` - Get user details
- `discord_get_guild_member` - Get member information
- `discord_list_guild_members` - List server members
- `discord_add_role_to_member` - Assign roles
- `discord_remove_role_from_member` - Remove roles
- `discord_kick_member` - Remove from server
- `discord_ban_member` - Ban users
- `discord_unban_member` - Unban users
- `discord_timeout_member` - Temporary restrictions

### 🔐 Role-Based Access Control (5 tools)

- `discord_create_role` - Create new roles
- `discord_edit_role` - Modify role properties
- `discord_delete_role` - Remove roles
- `discord_list_roles` - List server roles
- `discord_get_role_permissions` - Inspect role permissions

### 🔗 Invites & Integration Management (8 tools)

- `discord_create_invite` - Generate invite links
- `discord_delete_invite` - Remove invites
- `discord_list_invites` - List active invites
- `discord_list_integrations` - List third-party integrations
- `discord_delete_integration` - Remove integrations
- `discord_create_soundboard_sound` - Add soundboard sounds
- `discord_delete_soundboard_sound` - Remove sounds
- `discord_list_soundboard_sounds` - List available sounds

### 💌 Direct Messages (2 tools)

- `discord_send_direct_message` - Send DMs
- `discord_get_direct_messages` - Retrieve DM history

## Authentication

### Bot Setup

1. Create Discord Application at https://discord.com/developers/applications
2. Create Bot User and copy token
3. Set required permissions (Administrator recommended)
4. Invite bot to your server

### Required Permissions

- **Administrator** (recommended for full functionality)
- **Manage Channels** (channel operations)
- **Manage Roles** (role management)
- **Manage Messages** (message operations)
- **Send Messages** (basic messaging)
- **Read Message History** (message retrieval)

## Error Handling

The server includes comprehensive error handling with:

- **Automatic Retry** - Exponential backoff for transient failures
- **Circuit Breaker** - Prevents cascade failures
- **Graceful Degradation** - Fallback responses when services fail
- **Error Categorization** - Detailed error classification and guidance

### Common Error Codes

| Code  | Description         | Solution                   |
| ----- | ------------------- | -------------------------- |
| 50001 | Missing Access      | Check bot is in server     |
| 50013 | Missing Permissions | Grant required permissions |
| 10004 | Unknown Guild       | Verify guild ID            |
| 429   | Rate Limited        | Reduce request frequency   |
| 401   | Unauthorized        | Check bot token            |

## Security Features

- **Guild Allowlisting** - Restrict bot to specific servers
- **Channel Allowlisting** - Limit operations to approved channels
- **Permission Validation** - Runtime permission checking
- **Audit Logging** - Complete action tracking
- **Rate Limiting** - Built-in request throttling

## Monitoring & Health Checks

- **Health Endpoint** - `/health` for load balancer checks
- **Metrics Collection** - Performance and usage statistics
- **Error Tracking** - Comprehensive error monitoring
- **Circuit Breaker Status** - Service reliability monitoring

## Development

### Local Development

```bash
git clone https://github.com/sachicali/discordmcp-suite.git
cd mcp-discord-forum
npm install
npm run build
npm run dev
```

### Testing

```bash
# API tests
npm run test-api

# Environment validation
npm run validate-env
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
COPY . /app
WORKDIR /app
RUN npm ci --production
CMD ["npm", "start"]
```

### Environment Variables

- `DISCORD_TOKEN` - Bot authentication token (required)
- `TRANSPORT` - Communication protocol ("http" or "stdio")
- `HTTP_PORT` - Server port (default: 3000)
- `ALLOW_GUILD_IDS` - Comma-separated guild whitelist
- `ALLOW_CHANNEL_IDS` - Comma-separated channel whitelist
- `NODE_ENV` - Environment ("production", "development")

### Health Monitoring

```bash
# Health check endpoint
curl http://localhost:3000/health

# Metrics endpoint
curl http://localhost:3000/metrics
```

## Best Practices

### Security

1. Use guild and channel allowlists in production
2. Implement least-privilege bot permissions
3. Monitor and log all administrative actions
4. Rotate bot tokens regularly

### Performance

1. Implement rate limiting for high-volume operations
2. Use bulk operations when available
3. Cache frequently accessed data
4. Monitor circuit breaker status

### Reliability

1. Set up health monitoring
2. Implement graceful shutdown procedures
3. Use retry mechanisms for transient failures
4. Monitor error rates and patterns

## Support

- **Documentation**: [Full API Reference](./api-reference.md)
- **Issues**: [GitHub Issues](https://github.com/sachicali/discordmcp-suite/issues)
- **Discord**: [Support Server](https://discord.gg/your-support-server)

## License

MIT License - see LICENSE file for details.
