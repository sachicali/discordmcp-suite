/**
 * @fileoverview Developer Experience Service
 * @description Provides comprehensive API documentation, interactive testing,
 * development mode debugging, and plugin/extension system
 */

import { EventEmitter } from "events";
import { info, error } from "../logger.js";
import fs from "fs/promises";
import path from "path";

/**
 * API endpoint documentation
 */
interface APIEndpoint {
  name: string;
  description: string;
  parameters: APIParameter[];
  examples: APIExample[];
  returnType: string;
  errorCodes: string[];
  category: string;
  version: string;
}

/**
 * API parameter documentation
 */
interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: string;
  examples?: any[];
}

/**
 * API usage example
 */
interface APIExample {
  name: string;
  description: string;
  code: string;
  expectedOutput: string;
  language: "typescript" | "javascript" | "json";
}

/**
 * Plugin interface
 */
interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  dependencies: string[];
  hooks: PluginHook[];
  config: Record<string, any>;
  loadedAt?: number;
}

/**
 * Plugin hook definition
 */
interface PluginHook {
  event: string;
  handler: string; // Function name
  priority: number;
  once?: boolean;
}

/**
 * Test case for interactive testing
 */
interface TestCase {
  id: string;
  name: string;
  description: string;
  tool: string;
  parameters: Record<string, any>;
  expectedResult: any;
  createdAt: number;
  lastRun?: number;
  status?: "pass" | "fail" | "pending";
  error?: string;
}

/**
 * Development mode configuration
 */
interface DevModeConfig {
  enabled: boolean;
  logLevel: "debug" | "verbose" | "info";
  enableRequestLogging: boolean;
  enablePerformanceMetrics: boolean;
  enableStackTraces: boolean;
  mockResponses: boolean;
}

/**
 * Developer service configuration
 */
interface DeveloperServiceConfig {
  enableDocumentation: boolean;
  enableInteractiveTesting: boolean;
  enablePluginSystem: boolean;
  devMode: DevModeConfig;
  docsOutputPath: string;
  pluginDirectory: string;
}

/**
 * Developer Experience Service
 */
export class DeveloperService extends EventEmitter {
  private config: DeveloperServiceConfig;
  private apiEndpoints: Map<string, APIEndpoint> = new Map();
  private plugins: Map<string, Plugin> = new Map();
  private testCases: Map<string, TestCase> = new Map();
  private pluginHooks: Map<
    string,
    Array<{ plugin: Plugin; hook: PluginHook }>
  > = new Map();

  constructor(config: Partial<DeveloperServiceConfig> = {}) {
    super();

    this.config = {
      enableDocumentation: true,
      enableInteractiveTesting: true,
      enablePluginSystem: false, // Disabled by default for security
      devMode: {
        enabled: process.env.NODE_ENV === "development",
        logLevel: "info",
        enableRequestLogging: false,
        enablePerformanceMetrics: false,
        enableStackTraces: true,
        mockResponses: false,
      },
      docsOutputPath: "./docs",
      pluginDirectory: "./plugins",
      ...config,
    };

    this.initializeService();
  }

  /**
   * Initialize developer service
   */
  private async initializeService(): Promise<void> {
    if (this.config.enableDocumentation) {
      await this.loadAPIDocumentation();
    }

    if (this.config.enablePluginSystem) {
      await this.loadPlugins();
    }

    info("Developer Service initialized");
  }

  /**
   * Register API endpoint documentation
   */
  registerAPIEndpoint(endpoint: APIEndpoint): void {
    if (!this.config.enableDocumentation) return;

    this.apiEndpoints.set(endpoint.name, endpoint);
    info(`API endpoint documented: ${endpoint.name}`);
  }

  /**
   * Generate comprehensive API documentation
   */
  async generateAPIDocumentation(): Promise<void> {
    if (!this.config.enableDocumentation) {
      throw new Error("Documentation generation is disabled");
    }

    try {
      await fs.mkdir(this.config.docsOutputPath, { recursive: true });

      // Generate markdown documentation
      const markdown = this.generateMarkdownDocs();
      await fs.writeFile(
        path.join(this.config.docsOutputPath, "API_REFERENCE.md"),
        markdown,
      );

      // Generate JSON schema
      const schema = this.generateJSONSchema();
      await fs.writeFile(
        path.join(this.config.docsOutputPath, "api-schema.json"),
        JSON.stringify(schema, null, 2),
      );

      // Generate interactive HTML documentation
      const html = this.generateHTMLDocs();
      await fs.writeFile(
        path.join(this.config.docsOutputPath, "index.html"),
        html,
      );

      info(`API documentation generated at ${this.config.docsOutputPath}`);
    } catch (err) {
      error(`Failed to generate documentation: ${err}`);
    }
  }

  /**
   * Generate markdown documentation
   */
  private generateMarkdownDocs(): string {
    const endpoints = Array.from(this.apiEndpoints.values());
    const categories = [...new Set(endpoints.map((e) => e.category))];

    let markdown = `# Discord MCP Server API Reference

Generated on: ${new Date().toISOString()}

## Overview

This document provides comprehensive API reference for all Discord MCP Server tools.

## Categories

${categories.map((cat) => `- [${cat}](#${cat.toLowerCase().replace(/\s+/g, "-")})`).join("\n")}

`;

    for (const category of categories) {
      markdown += `\n## ${category}\n\n`;

      const categoryEndpoints = endpoints.filter(
        (e) => e.category === category,
      );

      for (const endpoint of categoryEndpoints) {
        markdown += `### ${endpoint.name}\n\n`;
        markdown += `${endpoint.description}\n\n`;

        if (endpoint.parameters.length > 0) {
          markdown += `#### Parameters\n\n`;
          markdown += `| Name | Type | Required | Description | Default |\n`;
          markdown += `|------|------|----------|-------------|---------|\n`;

          for (const param of endpoint.parameters) {
            markdown += `| ${param.name} | ${param.type} | ${param.required ? "✅" : "❌"} | ${param.description} | ${param.defaultValue || "N/A"} |\n`;
          }
          markdown += "\n";
        }

        if (endpoint.examples.length > 0) {
          markdown += `#### Examples\n\n`;
          for (const example of endpoint.examples) {
            markdown += `**${example.name}**\n\n`;
            markdown += `${example.description}\n\n`;
            markdown += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
            markdown += `Expected Output:\n\`\`\`json\n${example.expectedOutput}\n\`\`\`\n\n`;
          }
        }

        if (endpoint.errorCodes.length > 0) {
          markdown += `#### Error Codes\n\n`;
          for (const errorCode of endpoint.errorCodes) {
            markdown += `- ${errorCode}\n`;
          }
          markdown += "\n";
        }

        markdown += `---\n\n`;
      }
    }

    return markdown;
  }

  /**
   * Generate JSON schema for API
   */
  private generateJSONSchema(): any {
    const endpoints = Array.from(this.apiEndpoints.values());

    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Discord MCP Server API Schema",
      description: "JSON schema for Discord MCP Server API endpoints",
      version: "1.0.0",
      type: "object",
      properties: {
        tools: {
          type: "array",
          items: {
            type: "object",
            properties: endpoints.reduce((acc, endpoint) => {
              acc[endpoint.name] = {
                type: "object",
                description: endpoint.description,
                properties: endpoint.parameters.reduce((paramAcc, param) => {
                  paramAcc[param.name] = {
                    type: param.type.toLowerCase(),
                    description: param.description,
                    default: param.defaultValue,
                  };
                  return paramAcc;
                }, {} as any),
                required: endpoint.parameters
                  .filter((p) => p.required)
                  .map((p) => p.name),
              };
              return acc;
            }, {} as any),
          },
        },
      },
    };
  }

  /**
   * Generate interactive HTML documentation
   */
  private generateHTMLDocs(): string {
    const endpoints = Array.from(this.apiEndpoints.values());
    const categories = [...new Set(endpoints.map((e) => e.category))];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discord MCP Server API Reference</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #5865f2; padding-bottom: 10px; }
        h2 { color: #5865f2; margin-top: 40px; }
        h3 { color: #333; background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #5865f2; }
        .parameter-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .parameter-table th, .parameter-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .parameter-table th { background-color: #5865f2; color: white; }
        .example { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 6px; margin: 10px 0; overflow-x: auto; }
        .nav { background: #5865f2; color: white; padding: 15px; border-radius: 6px; margin-bottom: 30px; }
        .nav a { color: white; text-decoration: none; margin-right: 20px; }
        .nav a:hover { text-decoration: underline; }
        .test-button { background: #57f287; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 10px 0; }
        .test-button:hover { background: #3ba55c; }
        .required { color: #ed4245; font-weight: bold; }
        .optional { color: #faa61a; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Discord MCP Server API Reference</h1>
        <div class="nav">
            <strong>Categories:</strong>
            ${categories.map((cat) => `<a href="#${cat.toLowerCase().replace(/\s+/g, "-")}">${cat}</a>`).join("")}
        </div>

        ${categories
          .map((category) => {
            const categoryEndpoints = endpoints.filter(
              (e) => e.category === category,
            );
            return `
            <h2 id="${category.toLowerCase().replace(/\s+/g, "-")}">${category}</h2>
            ${categoryEndpoints
              .map(
                (endpoint) => `
              <h3>${endpoint.name}</h3>
              <p>${endpoint.description}</p>
              
              ${
                endpoint.parameters.length > 0
                  ? `
                <h4>Parameters</h4>
                <table class="parameter-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Description</th>
                      <th>Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${endpoint.parameters
                      .map(
                        (param) => `
                      <tr>
                        <td><code>${param.name}</code></td>
                        <td>${param.type}</td>
                        <td class="${param.required ? "required" : "optional"}">${param.required ? "Required" : "Optional"}</td>
                        <td>${param.description}</td>
                        <td>${param.defaultValue || "N/A"}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                  : ""
              }

              ${
                endpoint.examples.length > 0
                  ? `
                <h4>Examples</h4>
                ${endpoint.examples
                  .map(
                    (example) => `
                  <div>
                    <strong>${example.name}</strong>
                    <p>${example.description}</p>
                    <div class="example">
                      <pre>${example.code}</pre>
                    </div>
                    <p><strong>Expected Output:</strong></p>
                    <div class="example">
                      <pre>${example.expectedOutput}</pre>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              `
                  : ""
              }

              <button class="test-button" onclick="testEndpoint('${endpoint.name}')">🧪 Test This Endpoint</button>
              <hr>
            `,
              )
              .join("")}
          `;
          })
          .join("")}
    </div>

    <script>
      function testEndpoint(endpointName) {
        alert('Interactive testing for ' + endpointName + ' - Feature coming soon!');
      }
    </script>
</body>
</html>`;
  }

  /**
   * Add test case for interactive testing
   */
  addTestCase(testCase: Omit<TestCase, "id" | "createdAt">): string {
    if (!this.config.enableInteractiveTesting) {
      throw new Error("Interactive testing is disabled");
    }

    const id = `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const fullTestCase: TestCase = {
      ...testCase,
      id,
      createdAt: Date.now(),
      status: "pending",
    };

    this.testCases.set(id, fullTestCase);
    info(`Test case added: ${testCase.name} (${id})`);

    return id;
  }

  /**
   * Run test case
   */
  async runTestCase(
    testId: string,
    toolExecutor: (tool: string, params: any) => Promise<any>,
  ): Promise<boolean> {
    const testCase = this.testCases.get(testId);
    if (!testCase) {
      throw new Error(`Test case not found: ${testId}`);
    }

    try {
      info(`Running test case: ${testCase.name}`);
      const startTime = Date.now();

      const result = await toolExecutor(testCase.tool, testCase.parameters);

      const duration = Date.now() - startTime;
      const success =
        JSON.stringify(result) === JSON.stringify(testCase.expectedResult);

      testCase.status = success ? "pass" : "fail";
      testCase.lastRun = Date.now();

      if (!success) {
        testCase.error = `Expected: ${JSON.stringify(testCase.expectedResult)}, Got: ${JSON.stringify(result)}`;
      }

      this.emit("testCaseCompleted", {
        testId,
        testCase,
        success,
        duration,
        result,
      });

      info(
        `Test case ${success ? "PASSED" : "FAILED"}: ${testCase.name} (${duration}ms)`,
      );
      return success;
    } catch (err) {
      testCase.status = "fail";
      testCase.error = err instanceof Error ? err.message : String(err);
      testCase.lastRun = Date.now();

      this.emit("testCaseCompleted", {
        testId,
        testCase,
        success: false,
        error: testCase.error,
      });

      error(`Test case FAILED: ${testCase.name} - ${testCase.error}`);
      return false;
    }
  }

  /**
   * Run all test cases
   */
  async runAllTestCases(
    toolExecutor: (tool: string, params: any) => Promise<any>,
  ): Promise<{
    total: number;
    passed: number;
    failed: number;
    results: Array<{
      testId: string;
      name: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const testIds = Array.from(this.testCases.keys());
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const testId of testIds) {
      const testCase = this.testCases.get(testId)!;
      try {
        const success = await this.runTestCase(testId, toolExecutor);
        results.push({ testId, name: testCase.name, success });
        if (success) passed++;
        else failed++;
      } catch (err) {
        results.push({
          testId,
          name: testCase.name,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
        failed++;
      }
    }

    const summary = {
      total: testIds.length,
      passed,
      failed,
      results,
    };

    this.emit("testSuiteCompleted", summary);
    return summary;
  }

  /**
   * Load plugins from directory
   */
  async loadPlugins(): Promise<void> {
    if (!this.config.enablePluginSystem) return;

    try {
      await fs.mkdir(this.config.pluginDirectory, { recursive: true });

      const files = await fs.readdir(this.config.pluginDirectory);
      const pluginFiles = files.filter((file) => file.endsWith(".json"));

      for (const file of pluginFiles) {
        try {
          const pluginPath = path.join(this.config.pluginDirectory, file);
          const pluginData = JSON.parse(await fs.readFile(pluginPath, "utf-8"));

          await this.loadPlugin(pluginData);
        } catch (err) {
          error(`Failed to load plugin ${file}: ${err}`);
        }
      }

      info(`Loaded ${this.plugins.size} plugins`);
    } catch (err) {
      error(`Failed to load plugins: ${err}`);
    }
  }

  /**
   * Load individual plugin
   */
  private async loadPlugin(pluginData: any): Promise<void> {
    // Validate plugin structure
    if (!pluginData.id || !pluginData.name || !pluginData.version) {
      throw new Error("Invalid plugin structure");
    }

    const plugin: Plugin = {
      id: pluginData.id,
      name: pluginData.name,
      version: pluginData.version,
      description: pluginData.description || "",
      author: pluginData.author || "Unknown",
      enabled: pluginData.enabled !== false,
      dependencies: pluginData.dependencies || [],
      hooks: pluginData.hooks || [],
      config: pluginData.config || {},
      loadedAt: Date.now(),
    };

    // Check dependencies
    for (const dependency of plugin.dependencies) {
      if (!this.plugins.has(dependency)) {
        throw new Error(`Plugin dependency not found: ${dependency}`);
      }
    }

    this.plugins.set(plugin.id, plugin);

    // Register hooks
    for (const hook of plugin.hooks) {
      if (!this.pluginHooks.has(hook.event)) {
        this.pluginHooks.set(hook.event, []);
      }
      this.pluginHooks.get(hook.event)!.push({ plugin, hook });
    }

    info(`Plugin loaded: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Execute plugin hooks
   */
  async executeHooks(event: string, data: any): Promise<any[]> {
    if (!this.config.enablePluginSystem) return [];

    const hooks = this.pluginHooks.get(event) || [];
    const enabledHooks = hooks.filter(({ plugin }) => plugin.enabled);

    // Sort by priority
    enabledHooks.sort((a, b) => a.hook.priority - b.hook.priority);

    const results = [];

    for (const { plugin, hook } of enabledHooks) {
      try {
        // In a real implementation, you would execute the plugin's handler function
        // For this example, we'll just emit an event
        this.emit("pluginHookExecuted", {
          plugin: plugin.id,
          hook: hook.event,
          handler: hook.handler,
          data,
        });

        results.push({ plugin: plugin.id, success: true });
      } catch (err) {
        error(`Plugin hook failed: ${plugin.id}.${hook.handler} - ${err}`);
        results.push({ plugin: plugin.id, success: false, error: String(err) });
      }
    }

    return results;
  }

  /**
   * Get development mode status and logs
   */
  getDevModeStatus(): {
    enabled: boolean;
    config: DevModeConfig;
    recentLogs: string[];
    performance: Record<string, number>;
  } {
    return {
      enabled: this.config.devMode.enabled,
      config: this.config.devMode,
      recentLogs: [], // Would be populated with recent debug logs
      performance: {}, // Would be populated with performance metrics
    };
  }

  /**
   * Get developer statistics
   */
  getDeveloperStats(): {
    documentation: {
      endpoints: number;
      categories: number;
      examples: number;
    };
    testing: {
      testCases: number;
      lastRunResults: { passed: number; failed: number } | null;
    };
    plugins: {
      loaded: number;
      enabled: number;
      hooks: number;
    };
  } {
    const endpoints = Array.from(this.apiEndpoints.values());
    const categories = new Set(endpoints.map((e) => e.category)).size;
    const examples = endpoints.reduce((sum, e) => sum + e.examples.length, 0);

    const testCases = Array.from(this.testCases.values());
    const lastRunResults =
      testCases.length > 0
        ? {
            passed: testCases.filter((t) => t.status === "pass").length,
            failed: testCases.filter((t) => t.status === "fail").length,
          }
        : null;

    const plugins = Array.from(this.plugins.values());
    const totalHooks = plugins.reduce((sum, p) => sum + p.hooks.length, 0);

    return {
      documentation: {
        endpoints: endpoints.length,
        categories,
        examples,
      },
      testing: {
        testCases: testCases.length,
        lastRunResults,
      },
      plugins: {
        loaded: plugins.length,
        enabled: plugins.filter((p) => p.enabled).length,
        hooks: totalHooks,
      },
    };
  }

  /**
   * Load API documentation from existing tools
   */
  private async loadAPIDocumentation(): Promise<void> {
    // This would typically scan the codebase for tool definitions
    // For now, we'll create example documentation

    const exampleEndpoints: APIEndpoint[] = [
      {
        name: "discord_send",
        description: "Send a message to a Discord channel by ID or name",
        category: "Messaging",
        version: "1.0.0",
        parameters: [
          {
            name: "channel",
            type: "string",
            required: true,
            description: "Channel ID or channel name",
          },
          {
            name: "message",
            type: "string",
            required: true,
            description: "Message content to send",
          },
        ],
        examples: [
          {
            name: "Send simple message",
            description: "Send a basic text message to a channel",
            language: "typescript",
            code: 'await client.tools.discord_send({ channel: "general", message: "Hello World!" })',
            expectedOutput: '{ "success": true, "messageId": "123456789" }',
          },
        ],
        returnType: "MessageResponse",
        errorCodes: [
          "CHANNEL_NOT_FOUND",
          "MISSING_PERMISSIONS",
          "MESSAGE_TOO_LONG",
        ],
      },
    ];

    for (const endpoint of exampleEndpoints) {
      this.registerAPIEndpoint(endpoint);
    }
  }

  /**
   * Shutdown developer service
   */
  shutdown(): void {
    this.apiEndpoints.clear();
    this.plugins.clear();
    this.testCases.clear();
    this.pluginHooks.clear();

    info("Developer Service shutdown complete");
  }
}
