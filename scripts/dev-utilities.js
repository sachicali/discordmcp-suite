#!/usr/bin/env node

/**
 * @fileoverview Development Utilities for MCP Discord Server
 * @description Provides development tools, testing utilities, and helper scripts
 * for the MCP Discord Server project. Includes environment validation,
 * health monitoring, performance testing, and debugging tools.
 *
 * @author MCP Discord Team
 * @version 1.0.0
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Load environment variables
config();

/**
 * ANSI color codes for console output
 */
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
};

/**
 * Utility functions
 */
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.magenta}◦${colors.reset} ${msg}`),
  title: (msg) =>
    console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Validate environment configuration
 */
async function validateEnvironment() {
  log.title("Environment Validation");

  const checks = [
    {
      name: "Node.js Version",
      check: async () => {
        const { stdout } = await execAsync("node --version");
        const version = stdout.trim();
        const major = parseInt(version.slice(1).split(".")[0]);
        return {
          success: major >= 18,
          message: `${version} ${major >= 18 ? "(✓ Compatible)" : "(✗ Requires >= 18.0.0)"}`,
        };
      },
    },
    {
      name: "npm Version",
      check: async () => {
        const { stdout } = await execAsync("npm --version");
        const version = stdout.trim();
        return { success: true, message: version };
      },
    },
    {
      name: "Discord Token",
      check: async () => {
        const token = process.env.DISCORD_TOKEN;
        if (!token) {
          return { success: false, message: "Not configured" };
        }
        if (token.length < 50) {
          return { success: false, message: "Invalid format" };
        }
        return { success: true, message: `Configured (${token.length} chars)` };
      },
    },
    {
      name: "Transport Configuration",
      check: async () => {
        const transport = process.env.TRANSPORT || "stdio";
        const validTransports = ["http", "stdio"];
        return {
          success: validTransports.includes(transport.toLowerCase()),
          message: `${transport} ${validTransports.includes(transport.toLowerCase()) ? "(✓ Valid)" : "(✗ Invalid)"}`,
        };
      },
    },
    {
      name: "HTTP Port",
      check: async () => {
        const port = process.env.HTTP_PORT || "3000";
        const portNum = parseInt(port);
        const isValid = portNum > 0 && portNum < 65536;
        return {
          success: isValid,
          message: `${port} ${isValid ? "(✓ Valid)" : "(✗ Invalid port range)"}`,
        };
      },
    },
    {
      name: "TypeScript Compiler",
      check: async () => {
        try {
          const { stdout } = await execAsync("npx tsc --version");
          return { success: true, message: stdout.trim() };
        } catch {
          return { success: false, message: "Not installed" };
        }
      },
    },
    {
      name: "Project Dependencies",
      check: async () => {
        try {
          const packageJson = JSON.parse(
            await fs.readFile(path.join(rootDir, "package.json"), "utf8"),
          );
          const nodeModulesExists = await fs
            .access(path.join(rootDir, "node_modules"))
            .then(() => true)
            .catch(() => false);

          if (!nodeModulesExists) {
            return {
              success: false,
              message: "Dependencies not installed (run npm install)",
            };
          }

          const depCount = Object.keys(packageJson.dependencies || {}).length;
          const devDepCount = Object.keys(
            packageJson.devDependencies || {},
          ).length;
          return {
            success: true,
            message: `${depCount} dependencies, ${devDepCount} dev dependencies`,
          };
        } catch {
          return { success: false, message: "Error reading package.json" };
        }
      },
    },
  ];

  let allPassed = true;

  for (const { name, check } of checks) {
    try {
      const result = await check();
      if (result.success) {
        log.success(`${name}: ${result.message}`);
      } else {
        log.error(`${name}: ${result.message}`);
        allPassed = false;
      }
    } catch (error) {
      log.error(`${name}: Error - ${error.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    log.success("\nEnvironment validation passed! ✨");
  } else {
    log.error("\nEnvironment validation failed! Please fix the issues above.");
    process.exit(1);
  }
}

/**
 * Run comprehensive health check
 */
async function healthCheck() {
  log.title("Health Check");

  const checks = [
    {
      name: "Build Status",
      check: async () => {
        try {
          await execAsync("npm run build");
          return { success: true, message: "Build successful" };
        } catch (error) {
          return { success: false, message: `Build failed: ${error.message}` };
        }
      },
    },
    {
      name: "Server Start Test",
      check: async () => {
        try {
          const serverProcess = exec("timeout 10s npm start", { cwd: rootDir });

          return new Promise((resolve) => {
            let output = "";
            let hasStarted = false;

            serverProcess.stdout?.on("data", (data) => {
              output += data.toString();
              if (
                output.includes("Server is ready") ||
                output.includes("MCP server started")
              ) {
                hasStarted = true;
                serverProcess.kill();
                resolve({
                  success: true,
                  message: "Server starts successfully",
                });
              }
            });

            serverProcess.on("exit", (code) => {
              if (!hasStarted) {
                resolve({
                  success: false,
                  message: `Server failed to start (exit code: ${code})`,
                });
              }
            });

            setTimeout(() => {
              if (!hasStarted) {
                serverProcess.kill();
                resolve({ success: false, message: "Server start timeout" });
              }
            }, 9000);
          });
        } catch (error) {
          return {
            success: false,
            message: `Start test failed: ${error.message}`,
          };
        }
      },
    },
    {
      name: "Memory Usage",
      check: async () => {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        const isHealthy = heapUsedMB < 200; // Less than 200MB

        return {
          success: isHealthy,
          message: `${heapUsedMB}MB / ${heapTotalMB}MB ${isHealthy ? "(✓ Healthy)" : "(⚠ High usage)"}`,
        };
      },
    },
    {
      name: "Disk Space",
      check: async () => {
        try {
          const { stdout } = await execAsync("df -h .");
          const lines = stdout.trim().split("\n");
          const diskInfo = lines[1].split(/\s+/);
          const usage = diskInfo[4];
          const usagePercent = parseInt(usage.replace("%", ""));

          return {
            success: usagePercent < 90,
            message: `${usage} used ${usagePercent < 90 ? "(✓ Sufficient)" : "(⚠ Low space)"}`,
          };
        } catch {
          return {
            success: true,
            message: "Unable to check (non-Unix system)",
          };
        }
      },
    },
  ];

  let allHealthy = true;

  for (const { name, check } of checks) {
    try {
      const result = await check();
      if (result.success) {
        log.success(`${name}: ${result.message}`);
      } else {
        log.warn(`${name}: ${result.message}`);
        allHealthy = false;
      }
    } catch (error) {
      log.error(`${name}: Error - ${error.message}`);
      allHealthy = false;
    }
  }

  if (allHealthy) {
    log.success("\nHealth check passed! 🎉");
  } else {
    log.warn("\nHealth check completed with warnings.");
  }
}

/**
 * Run performance benchmarks
 */
async function performanceBench() {
  log.title("Performance Benchmark");

  const benchmarks = [
    {
      name: "Build Time",
      run: async () => {
        const startTime = Date.now();
        await execAsync("npm run build");
        const duration = Date.now() - startTime;
        return { duration, unit: "ms", threshold: 10000 };
      },
    },
    {
      name: "Package Install Time",
      run: async () => {
        // Test on a clean install
        const testDir = path.join(rootDir, "temp-test");
        await fs.mkdir(testDir, { recursive: true });

        try {
          await fs.copyFile(
            path.join(rootDir, "package.json"),
            path.join(testDir, "package.json"),
          );

          const startTime = Date.now();
          await execAsync("npm install --silent", { cwd: testDir });
          const duration = Date.now() - startTime;

          await fs.rm(testDir, { recursive: true, force: true });
          return { duration, unit: "ms", threshold: 30000 };
        } catch (error) {
          await fs.rm(testDir, { recursive: true, force: true });
          throw error;
        }
      },
    },
    {
      name: "Server Startup Time",
      run: async () => {
        const startTime = Date.now();
        const serverProcess = exec("npm start", { cwd: rootDir });

        return new Promise((resolve, reject) => {
          let hasStarted = false;

          serverProcess.stdout?.on("data", (data) => {
            if (
              data.includes("Server is ready") ||
              data.includes("MCP server started")
            ) {
              const duration = Date.now() - startTime;
              hasStarted = true;
              serverProcess.kill();
              resolve({ duration, unit: "ms", threshold: 5000 });
            }
          });

          serverProcess.on("exit", () => {
            if (!hasStarted) {
              reject(new Error("Server failed to start"));
            }
          });

          setTimeout(() => {
            if (!hasStarted) {
              serverProcess.kill();
              reject(new Error("Server startup timeout"));
            }
          }, 15000);
        });
      },
    },
  ];

  for (const { name, run } of benchmarks) {
    try {
      log.info(`Running ${name} benchmark...`);
      const result = await run();
      const isGood = result.duration < result.threshold;
      const status = isGood ? "✓ Good" : "⚠ Slow";
      const color = isGood ? colors.green : colors.yellow;

      console.log(
        `${color}${name}: ${result.duration}${result.unit} (${status})${colors.reset}`,
      );
    } catch (error) {
      log.error(`${name}: Failed - ${error.message}`);
    }
  }
}

/**
 * Generate development report
 */
async function generateReport() {
  log.title("Development Report");

  const report = {
    timestamp: new Date().toISOString(),
    environment: {},
    codebase: {},
    dependencies: {},
    performance: {},
  };

  try {
    // Environment info
    report.environment = {
      node_version: (await execAsync("node --version")).stdout.trim(),
      npm_version: (await execAsync("npm --version")).stdout.trim(),
      os: process.platform,
      arch: process.arch,
      discord_token_configured: !!process.env.DISCORD_TOKEN,
      transport: process.env.TRANSPORT || "stdio",
      http_port: process.env.HTTP_PORT || "3000",
    };

    // Codebase statistics
    const { stdout: fileCount } = await execAsync(
      'find src -name "*.ts" | wc -l',
    );
    const { stdout: lineCount } = await execAsync(
      'find src -name "*.ts" -exec wc -l {} + | tail -1',
    );

    report.codebase = {
      typescript_files: parseInt(fileCount.trim()),
      total_lines: parseInt(lineCount.trim().split(/\s+/)[0]),
      last_modified: new Date(
        (await fs.stat(path.join(rootDir, "src"))).mtime,
      ).toISOString(),
    };

    // Dependencies
    const packageJson = JSON.parse(
      await fs.readFile(path.join(rootDir, "package.json"), "utf8"),
    );
    report.dependencies = {
      production: Object.keys(packageJson.dependencies || {}).length,
      development: Object.keys(packageJson.devDependencies || {}).length,
      total:
        Object.keys(packageJson.dependencies || {}).length +
        Object.keys(packageJson.devDependencies || {}).length,
    };

    // Performance metrics
    const memUsage = process.memoryUsage();
    report.performance = {
      memory_heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      memory_heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      uptime_seconds: Math.round(process.uptime()),
    };

    // Write report to file
    const reportPath = path.join(rootDir, "dev-report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    log.success(`Development report generated: ${reportPath}`);

    // Display summary
    console.log("\n" + colors.bold + "Summary:" + colors.reset);
    console.log(`• TypeScript files: ${report.codebase.typescript_files}`);
    console.log(`• Lines of code: ${report.codebase.total_lines}`);
    console.log(
      `• Dependencies: ${report.dependencies.total} (${report.dependencies.production} prod, ${report.dependencies.development} dev)`,
    );
    console.log(`• Memory usage: ${report.performance.memory_heap_used_mb}MB`);
    console.log(`• Node.js: ${report.environment.node_version}`);
  } catch (error) {
    log.error(`Report generation failed: ${error.message}`);
  }
}

/**
 * Clean up development artifacts
 */
async function cleanup() {
  log.title("Development Cleanup");

  const cleanupTasks = [
    {
      name: "Build artifacts",
      path: "build",
      action: async () => {
        await fs.rm(path.join(rootDir, "build"), {
          recursive: true,
          force: true,
        });
      },
    },
    {
      name: "Log files",
      path: "*.log",
      action: async () => {
        const { stdout } = await execAsync('find . -name "*.log" -type f');
        const logFiles = stdout
          .trim()
          .split("\n")
          .filter((f) => f);
        for (const file of logFiles) {
          await fs.rm(file, { force: true });
        }
        return logFiles.length;
      },
    },
    {
      name: "Temporary files",
      path: "temp-*",
      action: async () => {
        const { stdout } = await execAsync('find . -name "temp-*" -type d');
        const tempDirs = stdout
          .trim()
          .split("\n")
          .filter((f) => f);
        for (const dir of tempDirs) {
          await fs.rm(dir, { recursive: true, force: true });
        }
        return tempDirs.length;
      },
    },
    {
      name: "Node modules cache",
      path: "node_modules/.cache",
      action: async () => {
        await fs.rm(path.join(rootDir, "node_modules", ".cache"), {
          recursive: true,
          force: true,
        });
      },
    },
    {
      name: "Development reports",
      path: "dev-report.json",
      action: async () => {
        await fs.rm(path.join(rootDir, "dev-report.json"), { force: true });
      },
    },
  ];

  for (const task of cleanupTasks) {
    try {
      const result = await task.action();
      const count = typeof result === "number" ? ` (${result} items)` : "";
      log.success(`Cleaned ${task.name}${count}`);
    } catch (error) {
      // Most cleanup errors are OK (file doesn't exist)
      log.debug(`${task.name}: ${error.message}`);
    }
  }

  log.success("\nCleanup completed! 🧹");
}

/**
 * Interactive development menu
 */
async function interactiveMenu() {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  while (true) {
    console.clear();
    log.title("MCP Discord Server - Development Utilities");

    console.log("Available commands:");
    console.log("1. Validate Environment");
    console.log("2. Health Check");
    console.log("3. Performance Benchmark");
    console.log("4. Generate Development Report");
    console.log("5. Cleanup Development Artifacts");
    console.log("6. Exit");
    console.log("");

    const choice = await question("Select an option (1-6): ");

    switch (choice) {
      case "1":
        await validateEnvironment();
        break;
      case "2":
        await healthCheck();
        break;
      case "3":
        await performanceBench();
        break;
      case "4":
        await generateReport();
        break;
      case "5":
        await cleanup();
        break;
      case "6":
        log.info("Goodbye! 👋");
        rl.close();
        return;
      default:
        log.warn("Invalid option. Please try again.");
    }

    console.log("\nPress any key to continue...");
    await question("");
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "validate":
    case "env":
      await validateEnvironment();
      break;
    case "health":
      await healthCheck();
      break;
    case "bench":
    case "benchmark":
      await performanceBench();
      break;
    case "report":
      await generateReport();
      break;
    case "cleanup":
    case "clean":
      await cleanup();
      break;
    case "menu":
    case undefined:
      await interactiveMenu();
      break;
    default:
      console.log("MCP Discord Server - Development Utilities\n");
      console.log("Usage: node dev-utilities.js [command]\n");
      console.log("Commands:");
      console.log("  validate, env     - Validate environment configuration");
      console.log("  health           - Run comprehensive health check");
      console.log("  bench, benchmark - Run performance benchmarks");
      console.log("  report           - Generate development report");
      console.log("  cleanup, clean   - Clean up development artifacts");
      console.log("  menu             - Interactive menu (default)");
      console.log("\nExamples:");
      console.log("  node dev-utilities.js validate");
      console.log("  node dev-utilities.js health");
      console.log("  node dev-utilities.js");
      break;
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
