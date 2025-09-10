# MCP Discord Server - Enterprise Discord Management

## Overview

The MCP Discord Server is a comprehensive Discord integration that provides **29 enterprise-level management tools** for complete Discord server administration. Built with TypeScript and featuring advanced security, error handling, and production-ready architecture.

## Build Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Run compiled version
- `npm run test-api` - Run API tests (no unit tests configured)

## Code Style

- **Language**: TypeScript with strict mode enabled
- **Module System**: ES modules (type: "module"), use .js extensions for imports
- **Target**: ES2022, Node 18+
- **Imports**: Use .js extensions for local imports, relative paths for local modules
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Formatting**: No specific linter/prettier config - follow existing patterns
- **Async**: Use async/await, avoid callbacks

## Types & Validation

- **Schemas**: Use Zod for all input validation (see src/schemas.ts)
- **Types**: Define interfaces in src/tools/types.ts
- **Exports**: Use named exports, avoid default exports

## Error Handling

- Use handleDiscordError() from src/errorHandler.ts for Discord API errors
- Return ToolResponse objects with isError flag for failures
- Log errors using logger.ts functions (info/error)
- Handle Discord error codes: 50001 (Missing Access), 10004 (Unknown Guild), 429 (Rate Limit)

## Core Features (58 Tools Total)

### 🔧 Basic Functions (2 tools)

- Server information retrieval
- Message sending (by ID or name)

### 📺 Channel Management (13 tools)

- Text channel CRUD operations
- Voice channel management
- Channel configuration and permissions

### 🗣️ Forum Functions (4 tools)

- Forum post creation, reading, replying
- Thread management and moderation

### 💬 Messages and Reactions (5 tools)

- Message reading and deletion
- Reaction management (add/remove/multiple)
- Bulk message operations

### 🎣 Webhook Management (4 tools)

- Webhook CRUD operations
- Message sending via webhooks

### 🏢 Server Management (15 tools) - NEW

- **Server Settings**: Update server name, description, features
- **Welcome Screen**: Configure welcome experience
- **Emojis & Stickers**: Full CRUD operations
- **Soundboard**: Sound management
- **Audit Logs**: Server activity tracking

### 🔐 Role-Based Access Control (5 tools) - NEW

- **Role Management**: Create, edit, delete roles
- **Permission System**: Full Discord permission management
- **Member Assignment**: Add/remove roles with audit logging
- **Permission Analysis**: Detailed role inspection

### 📝 Content Management (8 tools) - NEW

- **Bulk Operations**: Message deletion and moderation
- **Audit Logging**: Comprehensive activity tracking
- **Scheduled Events**: Full event lifecycle management
- **Content Moderation**: Advanced moderation workflows

### 👥 User Management (8 tools)

- Member information and role management
- Moderation actions (kick, ban, timeout, unban)
- User permission analysis

### 🎤 Voice Channels (5 tools)

- Voice channel CRUD operations
- User limit and bitrate configuration
- Voice channel information retrieval

### 💌 Direct Messages (2 tools)

- Send DMs to users
- Retrieve DM history (paginated)

### 🔗 Invite & Integration Management (5 tools) - NEW

- **Invite Management**: Create, list, delete invites
- **Integration Control**: Manage third-party integrations
- **Access Control**: Fine-grained permissions

## Advanced Features Added

### Enterprise Server Management

- **Complete RBAC System**: Full role and permission management
- **Server Administration**: Comprehensive server settings and configuration
- **Content Moderation**: Advanced moderation tools and audit logging
- **Integration Management**: Third-party service integration control
- **Bulk Operations**: Efficient bulk message and member management

### Security & Compliance

- **Audit Logging**: Complete server activity tracking
- **Permission Validation**: Granular permission checking
- **Rate Limiting**: Built-in rate limit handling
- **Error Recovery**: Comprehensive error handling and recovery

### Production Features

- **TypeScript**: Full type safety and IntelliSense support
- **Zod Validation**: Runtime type validation for all inputs
- **Docker Support**: Containerized deployment ready
- **Environment Configuration**: Flexible configuration management
- **Logging**: Structured logging with multiple levels

## Architecture

### Modular Design

- **Tool Separation**: Each feature category in separate files
- **Schema Validation**: Zod schemas for all tool inputs
- **Error Handling**: Centralized error management
- **Type Safety**: Full TypeScript coverage

### Security Model

- **Guild Allowlisting**: Restrict bot to specific servers
- **Channel Allowlisting**: Limit operations to approved channels
- **Permission Validation**: Runtime permission checking
- **Audit Trail**: Complete action logging

## Integration Options

### MCP Clients

- **Claude Desktop**: Native MCP support
- **Cursor**: Full MCP integration
- **Custom Clients**: HTTP and stdio transport options

### Deployment Methods

- **Docker**: Containerized deployment
- **NPM Package**: Direct installation
- **Smithery**: Automated installation
- **Manual**: Source code deployment

## Configuration

### Environment Variables

```bash
# Required
DISCORD_TOKEN=your_bot_token

# Security (recommended)
ALLOW_GUILD_IDS=guild_id_1,guild_id_2
ALLOW_CHANNEL_IDS=channel_id_1,channel_id_2

# Feature Flags
ENABLE_USER_MANAGEMENT=1
ENABLE_VOICE_CHANNELS=1
ENABLE_DIRECT_MESSAGES=1
ENABLE_SERVER_MANAGEMENT=1
ENABLE_RBAC=1
ENABLE_CONTENT_MANAGEMENT=1
```

### Bot Permissions

- **Administrator**: Full functionality (recommended)
- **Custom**: Granular permissions for specific features
- **Minimal**: Basic messaging functionality

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env`
4. Build project: `npm run build`
5. Run development: `npm run dev`

### Testing

- API testing available via `npm run test-api`
- Unit tests can be added using preferred framework
- Integration testing with Discord API

### Deployment

- Production build: `npm run build`
- Docker deployment: Use provided Docker images
- Environment configuration: Set production variables

## Troubleshooting

### Common Issues

- **Missing Permissions**: Verify bot permissions in Discord Developer Portal
- **Unknown Guild**: Check ALLOW_GUILD_IDS configuration
- **Rate Limiting**: Implement retry logic for 429 errors
- **DM Restrictions**: Users may have DMs disabled

### Debug Mode

- Enable detailed logging for troubleshooting
- Check server logs for error details
- Verify bot token and permissions

## Contributing

### Code Standards

- Follow existing TypeScript patterns
- Add Zod schemas for new tools
- Include comprehensive error handling
- Update documentation for new features

### Testing

- Test all new tools thoroughly
- Verify permission requirements
- Test error scenarios and edge cases
- Update README with new tool documentation

## License

MIT License - See LICENSE file for details
