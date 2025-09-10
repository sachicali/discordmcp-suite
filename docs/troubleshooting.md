# MCP Discord Server - Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Bot Token Invalid

**Problem**: `Login failed: Invalid Discord token provided`

**Solutions**:

1. Verify the token in Discord Developer Portal
2. Check that token isn't expired or revoked
3. Ensure token starts with correct prefix (bots should start with `MTIw...`)
4. Regenerate token if necessary

**Example**:

```bash
# Test token validity
npm run validate-env
```

#### Privileged Intents Not Enabled

**Problem**: `Privileged intent provided is not enabled`

**Solutions**:

1. Go to Discord Developer Portal
2. Navigate to your application
3. Go to Bot settings
4. Enable required intents:
   - Message Content Intent
   - Server Members Intent
   - Presence Intent

#### Connection Timeout

**Problem**: `Discord login timeout after 8 seconds`

**Solutions**:

1. Check network connectivity
2. Verify firewall settings
3. Try different network connection
4. Check Discord API status

### Permission Issues

#### Missing Access (Error 50001)

**Problem**: Bot can't access server or channel

**Solutions**:

1. Verify bot is added to the server
2. Check bot has appropriate permissions
3. Ensure allowlists include the server/channel
4. Re-invite bot with correct permissions

**Permission Generator**: https://discordapi.com/permissions.html

#### Missing Permissions (Error 50013)

**Problem**: Bot lacks specific permissions for action

**Common Required Permissions**:

- **Send Messages**: Basic messaging
- **Manage Messages**: Delete messages, reactions
- **Manage Channels**: Create, edit channels
- **Manage Roles**: Role management
- **Ban Members**: Member moderation
- **Administrator**: Full access (use carefully)

**Example Permission Check**:

```javascript
// Check if bot has permission
if (!member.permissions.has("MANAGE_ROLES")) {
  return { error: "Bot lacks Manage Roles permission" };
}
```

### Rate Limiting Issues

#### Rate Limited (Error 429)

**Problem**: Too many requests to Discord API

**Solutions**:

1. Reduce request frequency
2. Implement proper delays between operations
3. Use bulk operations where available
4. Check rate limiting configuration

**Rate Limiting Configuration**:

```env
# Reduce batch sizes
BULK_OPERATION_BATCH_SIZE=10
BULK_OPERATION_DELAY=2000

# Enable rate limiting
ENABLE_RATE_LIMITING=true
```

### Resource Not Found Errors

#### Unknown Guild (Error 10004)

**Problem**: Server not found or bot not member

**Solutions**:

1. Verify server ID is correct
2. Ensure bot is member of the server
3. Check guild allowlist configuration
4. Re-invite bot to server

#### Unknown Channel/Message (Error 10008)

**Problem**: Channel or message doesn't exist

**Solutions**:

1. Verify channel/message ID
2. Check bot has access to channel
3. Ensure channel hasn't been deleted
4. Check channel type compatibility

### Configuration Issues

#### Environment Variables

**Problem**: Configuration not loading correctly

**Check Environment Variables**:

```bash
# Required variables
echo $DISCORD_TOKEN
echo $TRANSPORT
echo $HTTP_PORT

# Optional security variables
echo $ALLOW_GUILD_IDS
echo $ALLOW_CHANNEL_IDS
```

**Example `.env` file**:

```env
DISCORD_TOKEN=your_bot_token_here
TRANSPORT=http
HTTP_PORT=3000
ALLOW_GUILD_IDS=guild_id_1,guild_id_2
ALLOW_CHANNEL_IDS=channel_id_1,channel_id_2
NODE_ENV=production
```

### Performance Issues

#### High Memory Usage

**Problem**: Server using excessive memory

**Solutions**:

1. Enable garbage collection logging
2. Check for memory leaks
3. Reduce cache sizes
4. Implement periodic cleanup

**Memory Monitoring**:

```bash
# Check memory usage
npm run health-check

# Monitor with htop
htop -p $(pgrep -f "mcp-discord")
```

#### High Latency

**Problem**: Slow response times

**Solutions**:

1. Check network connectivity
2. Monitor Discord API latency
3. Optimize database queries
4. Implement request caching

### Transport Issues

#### HTTP Transport Not Starting

**Problem**: Server fails to bind to port

**Solutions**:

1. Check if port is already in use: `lsof -i :3000`
2. Use different port: `HTTP_PORT=3001`
3. Check firewall settings
4. Verify user permissions

#### Stdio Transport Issues

**Problem**: Communication via stdin/stdout failing

**Solutions**:

1. Ensure proper MCP client connection
2. Check for conflicting output to stdout
3. Verify JSON message formatting
4. Enable debug logging

### Tool-Specific Issues

#### Forum Tools

**Problem**: Forum operations fail

**Common Issues**:

- Channel not a forum channel
- Missing thread permissions
- Thread archived or locked

**Solutions**:

```javascript
// Verify channel type
if (channel.type !== ChannelType.GuildForum) {
  throw new Error("Channel must be a forum channel");
}

// Check thread status
if (thread.archived) {
  await thread.setArchived(false);
}
```

#### Voice Channel Tools

**Problem**: Voice operations fail

**Common Issues**:

- Bot not connected to voice
- Missing voice permissions
- Voice channel full

**Solutions**:

1. Ensure bot has Connect permission
2. Check channel user limit
3. Verify bot voice state

#### Webhook Tools

**Problem**: Webhook operations fail

**Common Issues**:

- Invalid webhook URL
- Webhook deleted
- Missing webhook permissions

**Solutions**:

```javascript
// Validate webhook URL
const webhookRegex = /discord\.com\/api\/webhooks\/\d+\/[\w-]+/;
if (!webhookRegex.test(webhookUrl)) {
  throw new Error("Invalid webhook URL format");
}
```

### Debugging Tools

#### Enable Debug Logging

```bash
# Enable debug mode
DEBUG=mcp-discord:* npm start

# Enable Discord.js debug
DEBUG=discord.js:* npm start
```

#### Health Check Endpoint

```bash
# Check server health
curl http://localhost:3000/health

# Get metrics
curl http://localhost:3000/metrics
```

#### Test API Connectivity

```bash
# Run API tests
npm run test-api

# Test specific tool
curl -X POST http://localhost:3000/tools/discord_health_check
```

### Error Analysis

#### Reading Error Messages

**Discord API Errors** follow this format:

```json
{
  "message": "Missing Permissions",
  "code": 50013
}
```

**Common Error Codes**:

- `10004`: Unknown Guild
- `10008`: Unknown Message
- `10013`: Unknown User
- `50001`: Missing Access
- `50013`: Missing Permissions
- `429`: Rate Limited

#### Error Context

**Tool Response Errors** include context:

```json
{
  "success": false,
  "error": {
    "code": "MISSING_PERMISSIONS",
    "message": "Bot lacks required permissions",
    "details": {
      "required_permissions": ["MANAGE_CHANNELS"],
      "missing_permissions": ["MANAGE_CHANNELS"]
    },
    "suggestion": "Grant the bot Manage Channels permission"
  }
}
```

### Performance Optimization

#### Bulk Operations

Use bulk operations for efficiency:

```javascript
// Instead of individual operations
for (const messageId of messageIds) {
  await deleteMessage(messageId);
}

// Use bulk operation
await bulkDeleteMessages({
  channel_id: channelId,
  filter: { older_than_days: 30 },
});
```

#### Caching Strategy

```javascript
// Cache frequently accessed data
const guildCache = new Map();

// Use cache-first approach
let guild = guildCache.get(guildId);
if (!guild) {
  guild = await client.guilds.fetch(guildId);
  guildCache.set(guildId, guild);
}
```

### Security Best Practices

#### Production Deployment

1. Use environment variables for secrets
2. Enable allowlists for servers and channels
3. Implement proper error handling
4. Monitor for security vulnerabilities
5. Regular security audits

#### Access Control

```env
# Restrict to specific servers
ALLOW_GUILD_IDS=123456789,987654321

# Limit to specific channels
ALLOW_CHANNEL_IDS=111111111,222222222

# Enable audit logging
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_CHANNEL=333333333
```

### Monitoring and Alerting

#### Health Monitoring

```bash
# Setup monitoring
npm install pm2
pm2 start ecosystem.config.js

# Monitor with PM2
pm2 monit
pm2 logs mcp-discord
```

#### Alert Configuration

```javascript
// Configure alerts
const alerts = {
  memory_usage_mb: { threshold: 500, severity: "warning" },
  error_rate: { threshold: 0.05, severity: "critical" },
  response_time_ms: { threshold: 1000, severity: "warning" },
};
```

### Getting Help

#### Log Collection

When reporting issues, include:

1. **Server logs**: `pm2 logs mcp-discord --lines 100`
2. **Configuration**: Environment variables (redact secrets)
3. **Error details**: Full error messages and stack traces
4. **Steps to reproduce**: Exact sequence that causes issue
5. **System info**: Node.js version, OS, memory usage

#### Support Channels

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/sachicali/discordmcp-suite/issues)
- **Documentation**: [API Reference](./api/tool-reference.md)
- **Discord Support**: [Support Server](https://discord.gg/your-support-server)

#### Quick Diagnostics

```bash
# Run comprehensive diagnostics
./scripts/diagnose.sh

# Check system requirements
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 8.0.0

# Test Discord connectivity
npm run test-connection
```

This troubleshooting guide covers the most common issues and their solutions. For additional help, consult the API documentation or reach out through the support channels.
