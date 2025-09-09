import { ToolHandler } from "./types.js";
import { handleDiscordError } from "../errorHandler.js";
import { info, error } from "../logger.js";

// Get user information
export const getUserInfoHandler: ToolHandler = async (args, context) => {
  try {
    const user = await context.client.users.fetch(args.userId);
    return {
      content: [
        {
          type: "text",
          text: `User Info:
- ID: ${user.id}
- Username: ${user.username}
- Discriminator: ${user.discriminator}
- Display Name: ${user.displayName || "None"}
- Bot: ${user.bot ? "Yes" : "No"}
- Created: ${user.createdAt.toISOString()}
- Avatar: ${user.avatarURL() || "None"}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error getting user info: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Get guild member information
export const getGuildMemberHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = await guild.members.fetch(args.userId);
    const roles = member.roles.cache
      .map((role) => `${role.name} (${role.id})`)
      .join(", ");

    return {
      content: [
        {
          type: "text",
          text: `Guild Member Info:
- User: ${member.user.username}#${member.user.discriminator}
- Nickname: ${member.nickname || "None"}
- Joined: ${member.joinedAt?.toISOString() || "Unknown"}
- Roles: ${roles || "None"}
- Permissions: ${member.permissions.toArray().join(", ")}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error getting guild member: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// List guild members
export const listGuildMembersHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const members = await guild.members.fetch();
    const memberList = members
      .map(
        (member) =>
          `${member.user.username}#${member.user.discriminator} (${member.id}) - Roles: ${member.roles.cache.size}`,
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Guild Members (${members.size}):\n${memberList}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error listing guild members: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Add role to member
export const addRoleToMemberHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = await guild.members.fetch(args.userId);
    const role = guild.roles.cache.get(args.roleId);

    if (!role) {
      return {
        content: [{ type: "text", text: "Role not found" }],
        isError: true,
      };
    }

    await member.roles.add(role, args.reason || "Role added via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully added role "${role.name}" to ${member.user.username}#${member.user.discriminator}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error adding role to member: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Remove role from member
export const removeRoleFromMemberHandler: ToolHandler = async (
  args,
  context,
) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = await guild.members.fetch(args.userId);
    const role = guild.roles.cache.get(args.roleId);

    if (!role) {
      return {
        content: [{ type: "text", text: "Role not found" }],
        isError: true,
      };
    }

    await member.roles.remove(role, args.reason || "Role removed via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully removed role "${role.name}" from ${member.user.username}#${member.user.discriminator}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error removing role from member: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Kick member from guild
export const kickMemberHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = await guild.members.fetch(args.userId);
    await member.kick(args.reason || "Kicked via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully kicked ${member.user.username}#${member.user.discriminator} from the guild`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error kicking member: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Ban member from guild
export const banMemberHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = await guild.members.fetch(args.userId);
    await guild.members.ban(member, {
      reason: args.reason || "Banned via MCP",
      deleteMessageDays: args.deleteMessageDays || 0,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully banned ${member.user.username}#${member.user.discriminator} from the guild`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error banning member: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Unban member from guild
export const unbanMemberHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    await guild.members.unban(args.userId, args.reason || "Unbanned via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully unbanned user ${args.userId} from the guild`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error unbanning member: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Timeout member
export const timeoutMemberHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const member = await guild.members.fetch(args.userId);
    const timeoutUntil = args.durationMinutes
      ? Date.now() + args.durationMinutes * 60 * 1000
      : null;

    await member.timeout(timeoutUntil, args.reason || "Timed out via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully ${timeoutUntil ? "timed out" : "removed timeout for"} ${member.user.username}#${member.user.discriminator}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error timing out member: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Create role handler
export const createRoleHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    // Convert permission strings to bitfield
    let permissions = 0n;
    if (args.permissions && args.permissions.length > 0) {
      for (const perm of args.permissions) {
        // Map common permission names to their bit values
        const permMap: { [key: string]: bigint } = {
          CREATE_INSTANT_INVITE: 1n,
          KICK_MEMBERS: 2n,
          BAN_MEMBERS: 4n,
          ADMINISTRATOR: 8n,
          MANAGE_CHANNELS: 16n,
          MANAGE_GUILD: 32n,
          ADD_REACTIONS: 64n,
          VIEW_AUDIT_LOG: 128n,
          PRIORITY_SPEAKER: 256n,
          STREAM: 512n,
          VIEW_CHANNEL: 1024n,
          SEND_MESSAGES: 2048n,
          SEND_TTS_MESSAGES: 4096n,
          MANAGE_MESSAGES: 8192n,
          EMBED_LINKS: 16384n,
          ATTACH_FILES: 32768n,
          READ_MESSAGE_HISTORY: 65536n,
          MENTION_EVERYONE: 131072n,
          USE_EXTERNAL_EMOJIS: 262144n,
          VIEW_GUILD_INSIGHTS: 524288n,
          CONNECT: 1048576n,
          SPEAK: 2097152n,
          MUTE_MEMBERS: 4194304n,
          DEAFEN_MEMBERS: 8388608n,
          MOVE_MEMBERS: 16777216n,
          USE_VAD: 33554432n,
          CHANGE_NICKNAME: 67108864n,
          MANAGE_NICKNAMES: 134217728n,
          MANAGE_ROLES: 268435456n,
          MANAGE_WEBHOOKS: 536870912n,
          MANAGE_EMOJIS_AND_STICKERS: 1073741824n,
          USE_APPLICATION_COMMANDS: 2147483648n,
          REQUEST_TO_SPEAK: 4294967296n,
          MANAGE_EVENTS: 8589934592n,
          MANAGE_THREADS: 17179869184n,
          CREATE_PUBLIC_THREADS: 34359738368n,
          CREATE_PRIVATE_THREADS: 68719476736n,
          USE_EXTERNAL_STICKERS: 137438953472n,
          SEND_MESSAGES_IN_THREADS: 274877906944n,
          START_EMBEDDED_ACTIVITIES: 549755813888n,
          MODERATE_MEMBERS: 1099511627776n,
        };

        const upperPerm = perm.toUpperCase();
        if (permMap[upperPerm]) {
          permissions |= permMap[upperPerm];
        }
      }
    }

    const role = await guild.roles.create({
      name: args.name,
      color: args.color,
      hoist: args.hoist,
      mentionable: args.mentionable,
      permissions: permissions,
      reason: args.reason || "Role created via MCP",
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully created role "${role.name}" with ID: ${role.id}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error creating role: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Edit role handler
export const editRoleHandler: ToolHandler = async (args, context) => {
  try {
    const role = context.client.guilds.cache
      .map((guild) => guild.roles.cache.get(args.roleId))
      .find((role) => role !== undefined);

    if (!role) {
      return {
        content: [{ type: "text", text: "Role not found" }],
        isError: true,
      };
    }

    // Convert permission strings to bitfield if provided
    let permissions = role.permissions.bitfield;
    if (args.permissions && args.permissions.length > 0) {
      permissions = 0n;
      for (const perm of args.permissions) {
        const permMap: { [key: string]: bigint } = {
          CREATE_INSTANT_INVITE: 1n,
          KICK_MEMBERS: 2n,
          BAN_MEMBERS: 4n,
          ADMINISTRATOR: 8n,
          MANAGE_CHANNELS: 16n,
          MANAGE_GUILD: 32n,
          ADD_REACTIONS: 64n,
          VIEW_AUDIT_LOG: 128n,
          PRIORITY_SPEAKER: 256n,
          STREAM: 512n,
          VIEW_CHANNEL: 1024n,
          SEND_MESSAGES: 2048n,
          SEND_TTS_MESSAGES: 4096n,
          MANAGE_MESSAGES: 8192n,
          EMBED_LINKS: 16384n,
          ATTACH_FILES: 32768n,
          READ_MESSAGE_HISTORY: 65536n,
          MENTION_EVERYONE: 131072n,
          USE_EXTERNAL_EMOJIS: 262144n,
          VIEW_GUILD_INSIGHTS: 524288n,
          CONNECT: 1048576n,
          SPEAK: 2097152n,
          MUTE_MEMBERS: 4194304n,
          DEAFEN_MEMBERS: 8388608n,
          MOVE_MEMBERS: 16777216n,
          USE_VAD: 33554432n,
          CHANGE_NICKNAME: 67108864n,
          MANAGE_NICKNAMES: 134217728n,
          MANAGE_ROLES: 268435456n,
          MANAGE_WEBHOOKS: 536870912n,
          MANAGE_EMOJIS_AND_STICKERS: 1073741824n,
          USE_APPLICATION_COMMANDS: 2147483648n,
          REQUEST_TO_SPEAK: 4294967296n,
          MANAGE_EVENTS: 8589934592n,
          MANAGE_THREADS: 17179869184n,
          CREATE_PUBLIC_THREADS: 34359738368n,
          CREATE_PRIVATE_THREADS: 68719476736n,
          USE_EXTERNAL_STICKERS: 137438953472n,
          SEND_MESSAGES_IN_THREADS: 274877906944n,
          START_EMBEDDED_ACTIVITIES: 549755813888n,
          MODERATE_MEMBERS: 1099511627776n,
        };

        const upperPerm = perm.toUpperCase();
        if (permMap[upperPerm]) {
          permissions |= permMap[upperPerm];
        }
      }
    }

    await role.edit({
      name: args.name,
      color: args.color,
      hoist: args.hoist,
      mentionable: args.mentionable,
      permissions: permissions,
      reason: args.reason || "Role edited via MCP",
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully edited role "${role.name}"`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error editing role: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Delete role handler
export const deleteRoleHandler: ToolHandler = async (args, context) => {
  try {
    const role = context.client.guilds.cache
      .map((guild) => guild.roles.cache.get(args.roleId))
      .find((role) => role !== undefined);

    if (!role) {
      return {
        content: [{ type: "text", text: "Role not found" }],
        isError: true,
      };
    }

    await role.delete(args.reason || "Role deleted via MCP");

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted role "${role.name}"`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error deleting role: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// List roles handler
export const listRolesHandler: ToolHandler = async (args, context) => {
  try {
    const guild = context.client.guilds.cache.get(args.guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: "Guild not found" }],
        isError: true,
      };
    }

    const roles = guild.roles.cache
      .map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        permissions: role.permissions.toArray(),
        mentionable: role.mentionable,
        hoist: role.hoist,
        managed: role.managed,
        createdAt: role.createdAt.toISOString(),
      }))
      .sort((a, b) => b.position - a.position); // Sort by position (highest first)

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              guildName: guild.name,
              roleCount: roles.length,
              roles: roles,
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (err) {
    error(
      `Error listing roles: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};

// Get role permissions handler
export const getRolePermissionsHandler: ToolHandler = async (args, context) => {
  try {
    const role = context.client.guilds.cache
      .map((guild) => guild.roles.cache.get(args.roleId))
      .find((role) => role !== undefined);

    if (!role) {
      return {
        content: [{ type: "text", text: "Role not found" }],
        isError: true,
      };
    }

    const permissions = role.permissions.toArray();

    return {
      content: [
        {
          type: "text",
          text: `Role "${role.name}" Permissions:\n${permissions.join("\n")}`,
        },
      ],
    };
  } catch (err) {
    error(
      `Error getting role permissions: ${err instanceof Error ? err.message : String(err)}`,
    );
    return handleDiscordError(err);
  }
};
