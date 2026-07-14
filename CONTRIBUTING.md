# Contributing to CodeStrike

We love contributions! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/harshsharma-x/codestrike.git
cd codestrike

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Project Structure

```
codestrike/
├── apps/
│   ├── cli/        # Terminal CLI (Commander + Node.js)
│   ├── web/        # Web UI (Next.js 15)
│   └── server/     # API Server (Fastify)
├── packages/
│   ├── ai/         # 16 AI providers & routing
│   ├── agents/     # Multi-agent system (10 agents)
│   ├── core/       # Core types, errors, logging
│   ├── config/     # Configuration management
│   ├── plugins/    # Plugin system (registry + loader)
│   ├── memory/     # Memory/Session store
│   ├── tools/      # File, shell & git tools
│   ├── git/        # Git operations
│   ├── rag/        # RAG & project indexing
│   ├── terminal/   # Terminal execution
│   └── shared/     # Shared types & utilities
└── docs/           # Documentation
```

## Pull Request Process

1. Fork the repo and create a feature branch from `main`
2. Make your changes and ensure tests pass: `npm test`
3. Update documentation if needed
4. Open a PR describing what you changed and why

## Code Style

- TypeScript strict mode
- Prettier for formatting: `npm run format`
- ESLint for linting: `npm run lint`
- Keep it simple — avoid unnecessary abstractions

## Adding an AI Provider

1. Create `packages/ai/src/providers/<name>.ts` implementing `BaseAIProvider`
2. Add to `packages/ai/src/providers/registry.ts`
3. Add `.env.example` entry
4. Update docs and tests

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Questions?

Open a [Discussion](https://github.com/harshsharma-x/codestrike/discussions) or join us on [Discord](https://discord.gg/codestrike).
