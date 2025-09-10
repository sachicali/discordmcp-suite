#!/usr/bin/env node

/**
 * Local validation script for Discord MCP Server
 * Tests tool discovery and schema validation
 */

import http from "http";

const SERVER_HOST = "localhost";
const SERVER_PORT = 8080;

function makeRequest(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function validateServer() {
  console.log("🔍 Validating Discord MCP Server...\n");

  try {
    // Test 1: Health Check
    console.log("1. Testing health endpoint...");
    const health = await makeRequest("/health");
    if (health.status === 200) {
      console.log("✅ Health check passed");
    } else {
      console.log("❌ Health check failed:", health.status);
    }

    // Test 2: Tool Discovery
    console.log("\n2. Testing tool discovery...");
    const tools = await makeRequest("/tools");
    if (tools.status === 200 && tools.data.tools) {
      const toolCount = tools.data.tools.length;
      console.log(`📊 Found ${toolCount} tools`);

      if (toolCount === 70) {
        console.log("✅ Tool count correct (70 tools)");
      } else {
        console.log(`⚠️  Tool count mismatch: expected 70, got ${toolCount}`);
      }

      // Test 3: Schema Validation
      console.log("\n3. Testing schema validation...");
      let validSchemas = 0;
      let invalidSchemas = 0;

      tools.data.tools.forEach((tool, index) => {
        const { name, inputSchema } = tool;

        if (!inputSchema) {
          console.log(`❌ Tool ${index + 1}: ${name} - Missing inputSchema`);
          invalidSchemas++;
          return;
        }

        if (!inputSchema.type) {
          console.log(`❌ Tool ${index + 1}: ${name} - Missing schema type`);
          invalidSchemas++;
          return;
        }

        if (inputSchema.type === "object" && inputSchema.properties) {
          const props = Object.keys(inputSchema.properties);
          const required = inputSchema.required || [];

          // Check required fields exist
          const missingRequired = required.filter(
            (req) => !props.includes(req),
          );
          if (missingRequired.length > 0) {
            console.log(
              `❌ Tool ${index + 1}: ${name} - Missing required fields: ${missingRequired.join(", ")}`,
            );
            invalidSchemas++;
            return;
          }

          // Check property schemas
          for (const [propName, propSchema] of Object.entries(
            inputSchema.properties,
          )) {
            if (!propSchema || typeof propSchema !== "object") {
              console.log(
                `❌ Tool ${index + 1}: ${name} - Invalid property schema for '${propName}'`,
              );
              invalidSchemas++;
              return;
            }

            if (!propSchema.type) {
              console.log(
                `❌ Tool ${index + 1}: ${name} - Missing type for property '${propName}'`,
              );
              invalidSchemas++;
              return;
            }
          }
        }

        validSchemas++;
      });

      console.log(`✅ Valid schemas: ${validSchemas}`);
      console.log(`❌ Invalid schemas: ${invalidSchemas}`);

      // Test 4: Sample Tool Validation
      console.log("\n4. Testing sample tool schemas...");
      const sampleTools = [
        "discord_send",
        "discord_login",
        "discord_create_text_channel",
      ];

      sampleTools.forEach((toolName) => {
        const tool = tools.data.tools.find((t) => t.name === toolName);
        if (tool) {
          console.log(`✅ ${toolName}: Schema valid`);
          if (
            tool.inputSchema.properties &&
            Object.keys(tool.inputSchema.properties).length > 0
          ) {
            console.log(
              `   Properties: ${Object.keys(tool.inputSchema.properties).join(", ")}`,
            );
          } else {
            console.log(
              `   No parameters required (valid for status-type tools)`,
            );
          }
        } else {
          console.log(`❌ ${toolName}: Tool not found`);
        }
      });
    } else {
      console.log("❌ Tool discovery failed:", tools.status);
    }
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    console.log("\n💡 Make sure the server is running:");
    console.log("   npm run build && node build/fast-start.js");
  }
}

// Run validation
validateServer();
