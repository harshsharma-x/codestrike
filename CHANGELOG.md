# Changelog

## [0.1.0] - 2026-07-15

### Added
- **16 AI providers**: OpenRouter, Groq, HuggingFace, Ollama, LM Studio, DeepSeek, OpenAI, Anthropic, Gemini, Mistral, Together AI, Cerebras, Fireworks AI, xAI, NVIDIA Nemotron, Local GGUF
- **24 CLI commands**: init, chat, models, doctor, config, index, review, commit, explain, debug, fix, test, docs, search, status, run, login, terminal, session, providers, agent, memory, plugins, update
- **Plugin system** (`@codestrike/plugins`): Plugin manifest, registry, file system and node_modules loader
- **Memory store** (`@codestrike/memory`): JSON-file-backed sessions, preferences, project memory, command history, favorites
- **Tool system** (`@codestrike/tools`): File tools, shell tools (with dangerous command detection), git tools
- **Web UI** (Next.js 15) with 4 routes
- **API Server** (Fastify)
- **Docker** with docker-compose (server, web, Redis, ChromaDB)
- **Company landing page**: Dark theme, partner badges, scroll animations
- **108 unit tests** across 16 test suites

### Changed
- Monorepo restructured with npm workspaces
- CLI bundled as CJS with `noExternal` for npm deps (1.76 MB)
- Source types used instead of DTS generation for workspace packages
- Chalk chaining order fixed across all CLI files

### Fixed
- `better-sqlite3` native compilation issue — replaced with pure-JS JSON file store
- CLI build deps bundled correctly to avoid ESM/CJS chaining issues

### Architecture
```
codestrike/
├── apps/     (3): cli, web, server
└── packages/ (11): ai, agents, core, config, plugins, memory,
                   tools, git, rag, terminal, shared
```
