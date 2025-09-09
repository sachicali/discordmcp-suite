# MCP-Discord

[![smithery badge](https://smithery.ai/badge/@barryyip0625/mcp-discord)](https://smithery.ai/server/@barryyip0625/mcp-discord) ![](https://badge.mcpx.dev?type=server "MCP Server") [![Docker Hub](https://img.shields.io/docker/v/barryy625/mcp-discord?logo=docker&label=Docker%20Hub)](https://hub.docker.com/r/barryy625/mcp-discord)

A Discord MCP (Model Context Protocol) server that enables AI assistants to interact with the Discord platform.

<a href="https://glama.ai/mcp/servers/@barryyip0625/mcp-discord">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@barryyip0625/mcp-discord/badge" alt="MCP-Discord MCP server" />
</a>

## Overview

MCP-Discord provides comprehensive Discord integration with both basic and advanced features:

### Core Features

- Login to Discord bot
- Get server information
- Read/delete channel messages
- Send messages to specified channels (using either channel IDs or channel names)
- Retrieve forum channel lists
- Create/delete/reply to forum posts
- Create/delete text channels
- Add/remove message reactions
- Create/edit/delete/use webhooks

### Advanced Features ✨

- **User Management**: Complete member lifecycle management
  - Get user info, manage roles, permissions
  - Kick, ban, unban, and timeout members
  - Role assignment and removal with audit logging

- **Voice Channels**: Full voice channel management
  - Create, edit, delete voice channels
  - Configure user limits and bitrate settings
  - Get detailed voice channel information

- **Direct Messages**: Private user communication
  - Send DMs to users
  - Retrieve DM history
  - Handle DM conversations

### Key Benefits

- **Security First**: Guild/channel allowlists and safe defaults
- **Comprehensive**: Covers 58+ Discord API endpoints with enterprise-level features
- **Production Ready**: TypeScript, error handling, and logging
- **Easy Integration**: Works with Claude, Cursor, and other MCP clients
- **Enterprise Features**: Full RBAC, server management, and advanced moderation tools

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Tools Documentation](#tools-documentation)
  - [Basic Functions](#basic-functions)
  - [Channel Management](#channel-management)
  - [Forum Functions](#forum-functions)
  - [Messages and Reactions](#messages-and-reactions)
  - [Webhook Management](#webhook-management)
  - [Server Management](#server-management)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
  - [Content Management](#content-management)
  - [Invite & Integration Management](#invite--integration-management)
- [Development](#development)
- [License](#license)

## Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- A Discord bot with appropriate permissions
  - Bot token (obtainable from the [Discord Developer Portal](https://discord.com/developers/applications))
  - Message Content Intent enabled
  - Server Members Intent enabled
  - Presence Intent enabled

### Permissions Required

#### Basic Functionality (Original)

- Send Messages
- Create Public Threads
- Send Messages in Threads
- Manage Messages
- Manage Threads
- Manage Channels
- Manage Webhooks
- Add Reactions
- View Channel

#### Advanced Features (Newly Added)

For **User Management** features:

- Kick Members
- Ban Members
- Moderate Members (for timeouts)
- Manage Roles

For **Voice Channel Management**:

- Connect (to voice channels)
- Speak (in voice channels)
- Move Members (to move users between voice channels)

For **Direct Messages**:

- Send Messages (in DMs)

For **Server Management** (Newly Added):

- Manage Emojis and Stickers
- Manage Guild (server settings)
- View Audit Log
- Manage Events
- Create Instant Invite
- Manage Invites
- Manage Integrations
- Manage Soundboard

For **Advanced Moderation** (Newly Added):

- View Audit Log
- Manage Messages (for bulk operations)
- Moderate Members (enhanced timeout capabilities)

#### Easiest Setup

- **Administrator** (Recommended for full functionality with all new features)

- Add your Discord bot to your server
  - To add your Discord bot to your server, use one of the following invite links (replace `INSERT_CLIENT_ID_HERE` with your bot's client ID):
    - **Administrator (full access):**
      https://discord.com/oauth2/authorize?client_id=INSERT_CLIENT_ID_HERE&scope=bot&permissions=8
    - **Custom permissions (minimum required):**
      https://discord.com/oauth2/authorize?client_id=INSERT_CLIENT_ID_HERE&scope=bot&permissions=52076489808

> **Note:**  
> According to Discord's security model, a bot can only access information from servers it has been explicitly added to.  
> If you want to use this MCP server to access a specific Discord server, you must add the bot to that server first.  
> Use the invite link below to add the bot to your target server.

## Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Build the project:**

```bash
npm run build
```

3. **Configure your bot:**

```bash
# Create .env file
cp .env.example .env

# Edit .env with your bot token
DISCORD_TOKEN=your_bot_token_here
ALLOW_GUILD_IDS=your_guild_id
ENABLE_USER_MANAGEMENT=1
ENABLE_VOICE_CHANNELS=1
ENABLE_DIRECT_MESSAGES=1
```

4. **Run the server:**

```bash
npm start
```

## Installation

### Installing via NPM

You can use it with the following command:

```bash
npx mcp-discord --config ${DISCORD_TOKEN}
```

For more details, you can check out the [NPM Package](https://www.npmjs.com/package/mcp-discord).

### Installing via Smithery

To install mcp-discord automatically via [Smithery](https://smithery.ai/server/@barryyip0625/mcp-discord)

### Installing via Docker

You can run mcp-discord using Docker. The Docker images are automatically built and published to Docker Hub.

**Docker Hub Repository**: [barryy625/mcp-discord](https://hub.docker.com/r/barryy625/mcp-discord)

```bash
# Pull the latest image
docker pull barryy625/mcp-discord:latest

# Run with environment variable
docker run -e DISCORD_TOKEN=your_discord_bot_token -p 8080:8080 barryy625/mcp-discord:latest

# Or run with command line config
docker run -p 8080:8080 barryy625/mcp-discord:latest --config "your_discord_bot_token"
```

**Available Tags:**

- `latest` - Latest stable version from main branch
- `v1.3.3`, etc. - Specific version releases

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/barryyip0625/mcp-discord.git
cd mcp-discord

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

## Configuration

A Discord bot token is required for proper operation. The server supports two transport methods: stdio and streamable HTTP.

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Required
DISCORD_TOKEN=your_discord_bot_token

# Optional - Security (highly recommended for production)
ALLOW_GUILD_IDS=123456789,987654321    # Comma-separated list of allowed guild IDs
ALLOW_CHANNEL_IDS=111111111,222222222  # Comma-separated list of allowed channel IDs

# Optional - Advanced Features
ENABLE_USER_MANAGEMENT=1     # Enable user management tools (requires additional permissions)
ENABLE_VOICE_CHANNELS=1      # Enable voice channel management
ENABLE_DIRECT_MESSAGES=1     # Enable direct message functionality
ENABLE_SERVER_MANAGEMENT=1   # Enable server management tools (emojis, stickers, invites, etc.)
ENABLE_RBAC=1               # Enable role-based access control tools
ENABLE_CONTENT_MANAGEMENT=1  # Enable content management tools

# Optional - Transport
TRANSPORT=stdio              # 'stdio' or 'http'
PORT=3000                    # Port for HTTP transport (default: 8080)
```

### Transport Methods

1. **stdio** (Default)
   - Traditional stdio transport for basic usage
   - Suitable for simple integrations

2. **streamable HTTP**
   - HTTP-based transport for more advanced scenarios
   - Supports stateless operation
   - Configurable port number

### Configuration Options

You can provide configuration in two ways:

1. Environment variables (recommended):

```bash
DISCORD_TOKEN=your_discord_bot_token
ALLOW_GUILD_IDS=123456789
ENABLE_USER_MANAGEMENT=1
```

2. Using command line arguments:

```bash
# For stdio transport (default)
node build/index.js --config "your_discord_bot_token"

# For streamable HTTP transport
node build/index.js --transport http --port 3000 --config "your_discord_bot_token"
```

2. Using command line arguments:

```bash
# For stdio transport (default)
node build/index.js --config "your_discord_bot_token"

# For streamable HTTP transport
node build/index.js --transport http --port 3000 --config "your_discord_bot_token"
```

## Usage with Claude/Cursor

### Docker

You can use Docker containers with both Claude and Cursor. For full functionality with advanced features:

```json
{
  "mcpServers": {
    "discord": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-e",
        "DISCORD_TOKEN=your_discord_bot_token",
        "-e",
        "ALLOW_GUILD_IDS=your_guild_id",
        "-e",
        "ENABLE_USER_MANAGEMENT=1",
        "-e",
        "ENABLE_VOICE_CHANNELS=1",
        "-e",
        "ENABLE_DIRECT_MESSAGES=1",
        "-p",
        "8080:8080",
        "barryy625/mcp-discord:latest",
        "--transport",
        "http",
        "--port",
        "8080"
      ]
    }
  }
}
```

**Environment Variables for Docker:**

- `DISCORD_TOKEN`: Your bot token (required)
- `ALLOW_GUILD_IDS`: Comma-separated guild IDs (recommended)
- `ENABLE_USER_MANAGEMENT`: Enable user management features
- `ENABLE_VOICE_CHANNELS`: Enable voice channel management
- `ENABLE_DIRECT_MESSAGES`: Enable direct message features
- `ENABLE_SERVER_MANAGEMENT`: Enable server management tools
- `ENABLE_RBAC`: Enable role-based access control tools
- `ENABLE_CONTENT_MANAGEMENT`: Enable content management tools

### Claude

1. Using stdio transport (basic features):

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": [
        "path/to/mcp-discord/build/index.js",
        "--config",
        "your_discord_bot_token"
      ],
      "env": {
        "ALLOW_GUILD_IDS": "your_guild_id",
        "ENABLE_USER_MANAGEMENT": "1",
        "ENABLE_VOICE_CHANNELS": "1",
        "ENABLE_DIRECT_MESSAGES": "1",
        "ENABLE_SERVER_MANAGEMENT": "1",
        "ENABLE_RBAC": "1",
        "ENABLE_CONTENT_MANAGEMENT": "1"
      }
    }
  }
}
```

2. Using streamable HTTP transport (recommended for advanced features):

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": [
        "path/to/mcp-discord/build/index.js",
        "--transport",
        "http",
        "--port",
        "3000",
        "--config",
        "your_discord_bot_token"
      ],
      "env": {
        "ALLOW_GUILD_IDS": "your_guild_id",
        "ENABLE_USER_MANAGEMENT": "1",
        "ENABLE_VOICE_CHANNELS": "1",
        "ENABLE_DIRECT_MESSAGES": "1",
        "ENABLE_SERVER_MANAGEMENT": "1",
        "ENABLE_RBAC": "1",
        "ENABLE_CONTENT_MANAGEMENT": "1"
      }
    }
  }
}
```

2. Using streamable HTTP transport:

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": [
        "path/to/mcp-discord/build/index.js",
        "--transport",
        "http",
        "--port",
        "3000",
        "--config",
        "your_discord_bot_token"
      ]
    }
  }
}
```

### Cursor

1. Using stdio transport (basic features):

```json
{
  "mcpServers": {
    "discord": {
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "path/to/mcp-discord/build/index.js",
        "--config",
        "your_discord_bot_token"
      ]
    },
    "env": {
      "ALLOW_GUILD_IDS": "your_guild_id",
      "ENABLE_USER_MANAGEMENT": "1",
      "ENABLE_VOICE_CHANNELS": "1",
      "ENABLE_DIRECT_MESSAGES": "1",
      "ENABLE_SERVER_MANAGEMENT": "1",
      "ENABLE_RBAC": "1",
      "ENABLE_CONTENT_MANAGEMENT": "1"
    }
  }
}
```

2. Using streamable HTTP transport (recommended for advanced features):

```json
{
  "mcpServers": {
    "discord": {
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "path/to/mcp-discord/build/index.js",
        "--transport",
        "http",
        "--port",
        "3000",
        "--config",
        "your_discord_bot_token"
      ]
    },
    "env": {
      "ALLOW_GUILD_IDS": "your_guild_id",
      "ENABLE_USER_MANAGEMENT": "1",
      "ENABLE_VOICE_CHANNELS": "1",
      "ENABLE_DIRECT_MESSAGES": "1",
      "ENABLE_SERVER_MANAGEMENT": "1",
      "ENABLE_RBAC": "1",
      "ENABLE_CONTENT_MANAGEMENT": "1"
    }
  }
}
```

2. Using streamable HTTP transport:

```json
{
  "mcpServers": {
    "discord": {
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "path/to/mcp-discord/build/index.js",
        "--transport",
        "http",
        "--port",
        "3000",
        "--config",
        "your_discord_bot_token"
      ]
    }
  }
}
```

## Tools Documentation

### Basic Functions

- `discord_send`: Send a message to a specified channel (supports both channel ID and channel name)
- `discord_get_server_info`: Get Discord server information

### Channel Management

- `discord_create_text_channel`: Create a text channel
- `discord_delete_channel`: Delete a channel

### Forum Functions

- `discord_get_forum_channels`: Get a list of forum channels
- `discord_create_forum_post`: Create a forum post
- `discord_get_forum_post`: Get a forum post
- `discord_reply_to_forum`: Reply to a forum post
- `discord_delete_forum_post`: Delete a forum post

### Messages and Reactions

- `discord_read_messages`: Read channel messages
- `discord_add_reaction`: Add a reaction to a message
- `discord_add_multiple_reactions`: Add multiple reactions to a message
- `discord_remove_reaction`: Remove a reaction from a message
- `discord_delete_message`: Delete a specific message from a channel

### Webhook Management

- `discord_create_webhook`: Creates a new webhook for a Discord channel
- `discord_send_webhook_message`: Sends a message to a Discord channel using a webhook
- `discord_edit_webhook`: Edits an existing webhook for a Discord channel
- `discord_delete_webhook`: Deletes an existing webhook for a Discord channel

### Server Management

- `discord_get_server_info`: Get comprehensive Discord server information
- `discord_update_server_settings`: Update server settings (name, description, icon, banner, features)
- `discord_get_server_features`: Get server features and capabilities
- `discord_get_welcome_screen`: Get server welcome screen configuration
- `discord_update_welcome_screen`: Update server welcome screen
- `discord_list_emojis`: List all server emojis
- `discord_create_emoji`: Create a new server emoji
- `discord_delete_emoji`: Delete a server emoji
- `discord_list_stickers`: List all server stickers
- `discord_create_sticker`: Create a new server sticker
- `discord_delete_sticker`: Delete a server sticker
- `discord_list_soundboard_sounds`: List server soundboard sounds
- `discord_create_soundboard_sound`: Create a new soundboard sound
- `discord_delete_soundboard_sound`: Delete a soundboard sound

### Role-Based Access Control (RBAC)

- `discord_create_role`: Create a new server role with permissions
- `discord_edit_role`: Edit existing role properties and permissions
- `discord_delete_role`: Delete a server role
- `discord_list_roles`: List all server roles with permissions
- `discord_get_role_permissions`: Get detailed role permissions
- `discord_add_role_to_member`: Add role to member with audit logging
- `discord_remove_role_from_member`: Remove role from member with audit logging

### Content Management

- `discord_bulk_delete_messages`: Bulk delete messages from channel
- `discord_get_audit_logs`: Retrieve server audit logs
- `discord_list_scheduled_events`: List server scheduled events
- `discord_create_scheduled_event`: Create a new scheduled event
- `discord_edit_scheduled_event`: Edit existing scheduled event
- `discord_delete_scheduled_event`: Delete a scheduled event

### Invite & Integration Management

- `discord_list_invites`: List server invites
- `discord_create_invite`: Create a new server invite
- `discord_delete_invite`: Delete a server invite
- `discord_list_integrations`: List server integrations
- `discord_create_integration`: Create a new server integration
- `discord_edit_integration`: Edit existing integration
- `discord_delete_integration`: Delete a server integration

## Advanced Features

### User Management

**Prerequisites:** Bot needs `Kick Members`, `Ban Members`, `Moderate Members`, and `Manage Roles` permissions.

- `discord_get_user_info`: Get detailed information about a Discord user
- `discord_get_guild_member`: Get member info including roles and permissions
- `discord_list_guild_members`: List all members in a server
- `discord_add_role_to_member`: Add a role to a member (with audit reason)
- `discord_remove_role_from_member`: Remove a role from a member (with audit reason)
- `discord_kick_member`: Kick a member from the server (with reason)
- `discord_ban_member`: Ban a member (optionally delete message history)
- `discord_unban_member`: Unban a previously banned user
- `discord_timeout_member`: Timeout a member for specified duration

### Voice Channel Management

**Prerequisites:** Bot needs `Connect`, `Speak`, and `Move Members` permissions.

- `discord_create_voice_channel`: Create voice channel with custom settings (name, user limit, bitrate)
- `discord_delete_voice_channel`: Delete a voice channel
- `discord_edit_voice_channel`: Modify voice channel properties
- `discord_list_voice_channels`: List all voice channels in a server
- `discord_get_voice_channel_info`: Get detailed info about voice channel and connected users

### Direct Messages

**Prerequisites:** Bot needs `Send Messages` permission in DMs.

- `discord_send_direct_message`: Send a direct message to a user
- `discord_get_direct_messages`: Retrieve DM history with a user (paginated)

### Server Management (New)

**Prerequisites:** Bot needs `Manage Emojis and Stickers`, `Manage Guild`, `View Audit Log`, `Manage Events`, `Create Instant Invite`, `Manage Invites`, `Manage Integrations`, `Manage Soundboard` permissions.

- **Server Settings**: Update server name, description, features, and configuration
- **Welcome Screen**: Configure and manage server welcome experience
- **Emojis & Stickers**: Full CRUD operations for server emojis and stickers
- **Soundboard**: Manage server soundboard sounds
- **Audit Logs**: Access server audit logs for moderation tracking

### Role-Based Access Control (RBAC) (New)

**Prerequisites:** Bot needs `Manage Roles` permission.

- **Role Management**: Create, edit, delete, and list server roles
- **Permission System**: Full Discord permission management
- **Member Role Assignment**: Add/remove roles with audit logging
- **Permission Analysis**: Detailed role permission inspection

### Content Management (New)

**Prerequisites:** Bot needs `Manage Messages`, `View Audit Log`, `Manage Events` permissions.

- **Bulk Operations**: Bulk message deletion and moderation
- **Audit Logging**: Comprehensive server activity tracking
- **Scheduled Events**: Full event lifecycle management
- **Content Moderation**: Advanced moderation tools and workflows

### Invite & Integration Management (New)

**Prerequisites:** Bot needs `Create Instant Invite`, `Manage Invites`, `Manage Integrations` permissions.

- **Invite Management**: Create, list, and delete server invites
- **Integration Control**: Manage third-party integrations and bots
- **Access Control**: Fine-grained invite and integration permissions

### User Management

**Prerequisites:** Bot needs `Kick Members`, `Ban Members`, `Moderate Members`, and `Manage Roles` permissions.

- `discord_get_user_info`: Get detailed information about a Discord user
- `discord_get_guild_member`: Get member info including roles and permissions
- `discord_list_guild_members`: List all members in a server
- `discord_add_role_to_member`: Add a role to a member (with audit reason)
- `discord_remove_role_from_member`: Remove a role from a member (with audit reason)
- `discord_kick_member`: Kick a member from the server (with reason)
- `discord_ban_member`: Ban a member (optionally delete message history)
- `discord_unban_member`: Unban a previously banned user
- `discord_timeout_member`: Timeout a member for specified duration

### Voice Channel Management

**Prerequisites:** Bot needs `Connect`, `Speak`, and `Move Members` permissions.

- `discord_create_voice_channel`: Create voice channel with custom settings (name, user limit, bitrate)
- `discord_delete_voice_channel`: Delete a voice channel
- `discord_edit_voice_channel`: Modify voice channel properties
- `discord_list_voice_channels`: List all voice channels in a server
- `discord_get_voice_channel_info`: Get detailed info about voice channel and connected users

### Direct Messages

**Prerequisites:** Bot needs `Send Messages` permission in DMs.

- `discord_send_direct_message`: Send a direct message to a user
- `discord_get_direct_messages`: Retrieve DM history with a user (paginated)

## Usage Examples

### User Management

#### Get User Information

```json
{
  "tool": "discord_get_user_info",
  "input": {
    "userId": "123456789012345678"
  }
}
```

#### Add Role to Member

```json
{
  "tool": "discord_add_role_to_member",
  "input": {
    "guildId": "987654321098765432",
    "userId": "123456789012345678",
    "roleId": "555666777888999000",
    "reason": "Added moderator role"
  }
}
```

#### Ban a Member

```json
{
  "tool": "discord_ban_member",
  "input": {
    "guildId": "987654321098765432",
    "userId": "123456789012345678",
    "reason": "Violation of server rules",
    "deleteMessageDays": 7
  }
}
```

#### Timeout a Member

```json
{
  "tool": "discord_timeout_member",
  "input": {
    "guildId": "987654321098765432",
    "userId": "123456789012345678",
    "durationMinutes": 60,
    "reason": "Temporary timeout for spam"
  }
}
```

### Voice Channel Management

#### Create Voice Channel

```json
{
  "tool": "discord_create_voice_channel",
  "input": {
    "guildId": "987654321098765432",
    "name": "Gaming Voice",
    "userLimit": 10,
    "bitrate": 64000
  }
}
```

#### Edit Voice Channel

```json
{
  "tool": "discord_edit_voice_channel",
  "input": {
    "channelId": "111222333444555666",
    "name": "Updated Voice Channel",
    "userLimit": 5,
    "bitrate": 128000
  }
}
```

#### Get Voice Channel Info

```json
{
  "tool": "discord_get_voice_channel_info",
  "input": {
    "channelId": "111222333444555666"
  }
}
```

### Direct Messages

#### Send Direct Message

```json
{
  "tool": "discord_send_direct_message",
  "input": {
    "userId": "123456789012345678",
    "message": "Hello! This is a direct message from the bot."
  }
}
```

#### Get DM History

```json
{
  "tool": "discord_get_direct_messages",
  "input": {
    "userId": "123456789012345678",
    "limit": 10
  }
}
```

### Server Management

#### Create Server Emoji

```json
{
  "tool": "discord_create_emoji",
  "input": {
    "guildId": "987654321098765432",
    "name": "custom_emoji",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "reason": "Adding custom emoji for server branding"
  }
}
```

#### Create Server Role

```json
{
  "tool": "discord_create_role",
  "input": {
    "guildId": "987654321098765432",
    "name": "Moderator",
    "permissions": ["KICK_MEMBERS", "BAN_MEMBERS", "MANAGE_MESSAGES"],
    "color": 16711680,
    "hoist": true,
    "mentionable": true,
    "reason": "Creating moderator role for server management"
  }
}
```

#### Update Server Settings

```json
{
  "tool": "discord_update_server_settings",
  "input": {
    "guildId": "987654321098765432",
    "name": "Updated Server Name",
    "description": "Updated server description",
    "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "banner": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "features": ["COMMUNITY", "DISCOVERABLE"],
    "verificationLevel": "MEDIUM",
    "defaultMessageNotifications": "ONLY_MENTIONS"
  }
}
```

#### Create Server Invite

```json
{
  "tool": "discord_create_invite",
  "input": {
    "channelId": "111222333444555666",
    "maxAge": 86400,
    "maxUses": 10,
    "temporary": false,
    "unique": true,
    "reason": "Creating invite for new members"
  }
}
```

#### Bulk Delete Messages

```json
{
  "tool": "discord_bulk_delete_messages",
  "input": {
    "channelId": "111222333444555666",
    "messageIds": ["777888999000111222", "333444555666777888"],
    "reason": "Bulk deleting spam messages"
  }
}
```

#### Change Server Icon

```json
{
  "tool": "discord_update_server_settings",
  "input": {
    "guildId": "987654321098765432",
    "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "reason": "Updating server icon"
  }
}
```

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Troubleshooting

### Common Issues

**"Missing Permissions" Error**

- Ensure your bot has the required permissions in Discord Developer Portal
- For user management: Add `Kick Members`, `Ban Members`, `Moderate Members`, `Manage Roles`
- For voice channels: Add `Connect`, `Speak`, `Move Members`
- For DMs: Ensure bot can send messages in DMs

**"Unknown Guild" Error**

- Verify the `guildId` is correct
- Ensure the bot is added to the target server
- Check `ALLOW_GUILD_IDS` environment variable if set

**Voice Channel Errors**

- Bot needs `Connect` permission to manage voice channels
- Some voice operations require the bot to be in the voice channel

**DM Errors**

- Bot cannot DM users who have DMs disabled
- Bot cannot DM users who are not in a mutual server (unless they share a server)

### Environment Variables

```bash
# Enable specific features
ENABLE_USER_MANAGEMENT=1
ENABLE_VOICE_CHANNELS=1
ENABLE_DIRECT_MESSAGES=1
ENABLE_SERVER_MANAGEMENT=1
ENABLE_RBAC=1
ENABLE_CONTENT_MANAGEMENT=1

# Security (recommended)
ALLOW_GUILD_IDS=your_guild_id_here
ALLOW_CHANNEL_IDS=your_channel_ids_here
```

## License

[MIT License](https://github.com/barryyip0625/mcp-discord?tab=MIT-1-ov-file)
