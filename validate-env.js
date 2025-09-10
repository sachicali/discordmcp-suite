#!/usr/bin/env node

/**
 * Environment validation script for Discord MCP Suite
 * This script validates required environment variables for cloud deployment
 */

const requiredVars = ["DISCORD_TOKEN"];

const optionalVars = [
  "PORT",
  "HTTP_PORT",
  "ALLOW_GUILD_IDS",
  "ALLOW_CHANNEL_IDS",
  "ENABLE_USER_MANAGEMENT",
  "ENABLE_VOICE_CHANNELS",
  "ENABLE_DIRECT_MESSAGES",
  "ENABLE_SERVER_MANAGEMENT",
  "ENABLE_RBAC",
  "ENABLE_CONTENT_MANAGEMENT",
  "TRANSPORT",
  "HEALTH_CHECK_ENABLED",
  "CONFIG_ENDPOINT_ENABLED",
];

console.log("🔍 Validating environment variables for Discord MCP Suite...\n");

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log("📋 Required Variables:");
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING (Required)`);
    hasErrors = true;
  } else {
    const masked = value.length > 10 ? value.substring(0, 10) + "..." : value;
    console.log(`✅ ${varName}: ${masked}`);
  }
});

console.log("\n📋 Optional Variables:");
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value !== undefined) {
    const masked =
      varName.includes("TOKEN") && value.length > 10
        ? value.substring(0, 10) + "..."
        : value;
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.log(`⚪ ${varName}: not set`);
  }
});

// Cloud deployment specific checks
console.log("\n☁️  Cloud Deployment Checks:");

if (process.env.NODE_ENV === "production") {
  console.log("✅ Running in production mode");

  if (!process.env.DISCORD_TOKEN) {
    console.log("❌ CRITICAL: DISCORD_TOKEN must be set in production");
    hasErrors = true;
  }

  if (!process.env.PORT && !process.env.HTTP_PORT) {
    console.log("⚠️  WARNING: Neither PORT nor HTTP_PORT is set");
    hasWarnings = true;
  }
} else {
  console.log("ℹ️  Running in development mode");
}

// Summary
console.log("\n📊 Validation Summary:");
if (hasErrors) {
  console.log("❌ FAILED: Critical environment variables are missing");
  process.exit(1);
} else if (hasWarnings) {
  console.log("⚠️  PASSED with warnings");
  process.exit(0);
} else {
  console.log("✅ PASSED: All required variables are set");
  process.exit(0);
}
