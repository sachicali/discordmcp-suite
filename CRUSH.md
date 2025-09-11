# Build Commands
- `bun run build` - Compile TypeScript to JavaScript
- `bun run dev` - Run in development mode with ts-node
- `bun run test-api` - Run API tests
- `bun run test:unit` - Run unit tests
- `bun run test:integration` - Run integration tests
- `bun run test:e2e` - Run e2e tests
- `bun run lint` - ESLint check
- `bun run lint:fix` - ESLint with auto-fix
- `bun run type-check` - TypeScript type checking
- `bun run format` - Prettier formatting

# Code Style
- **Language**: TypeScript with strict mode
- **Module System**: ES modules (type: "module"), use .js extensions for imports
- **Target**: ES2022, Node 18+
- **Imports**: Use .js extensions for local imports, relative paths
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Validation**: Use Zod schemas for all input validation
- **Error Handling**: Use handleDiscordError() for Discord API errors
- **Async**: Use async/await, avoid callbacks
- **Exports**: Named exports only, avoid default exports