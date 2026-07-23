# CodeStrike AI

**Open-source AI-powered coding assistant** — 16 AI providers, 25 CLI commands, MCP support, plugin system, multi-agent collaboration, desktop app, and Web IDE.

<p align="center">
  <a href="https://github.com/harshsharma-x/codestrike/actions/workflows/ci.yml"><img src="https://github.com/harshsharma-x/codestrike/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/codestrike"><img src="https://img.shields.io/npm/v/codestrike.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/harshsharma-x/codestrike"><img src="https://img.shields.io/github/stars/harshsharma-x/codestrike?style=social" alt="GitHub stars"></a>
</p>

## One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/harshsharma-x/codestrike/main/scripts/install.sh | bash
```

Or via npm:

```bash
npm install -g codestrike
npx codestrike init  # run without install
```

## Quick Start

```bash
codestrike init              # Initialize in your project
codestrike doctor            # Check system health
codestrike providers         # List all 16 AI providers
codestrike chat "Explain this code"  # Start a chat
```

## Features

- **16 AI Providers** — OpenRouter, Groq, HuggingFace, Ollama, LM Studio, DeepSeek, OpenAI, Anthropic, Gemini, Mistral, Together AI, Cerebras, Fireworks AI, xAI, NVIDIA Nemotron, Local GGUF
- **25 CLI Commands** — Full suite for every development task (+4 MCP subcommands)
- **MCP Support** — Model Context Protocol for connecting AI to external tools
- **Multi-Agent System** — 10 specialized agents collaborating on your code
- **Plugin System** — Extend with custom plugins from npm or local paths
- **Memory Store** — Session history, preferences, project memory, favorites
- **Tool System** — File, shell (with danger detection), and git tools
- **RAG Indexing** — Semantic search across your entire codebase
- **Web IDE** — Next.js 15 browser interface with chat, terminal, git, explorer
- **Desktop App** — Electron wrapper for native experience
- **API Server** — Fastify REST API + WebSocket + Swagger docs
- **WebSocket Terminal** — Real-time terminal via WebSocket with auto-reconnect
- **Docker Support** — Ready-to-deploy containers

## CLI Commands (25 + 4 subcommands)

| Command     | Description                               |
| ----------- | ----------------------------------------- |
| `init`      | Initialize CodeStrike in project          |
| `chat`      | Interactive AI chat session               |
| `models`    | List AI models and providers              |
| `doctor`    | System health diagnostics                 |
| `config`    | View/modify configuration                 |
| `index`     | Index project for AI context              |
| `review`    | Code review                               |
| `commit`    | Generate commit messages                  |
| `explain`   | Explain code or concepts                  |
| `debug`     | Debug code or errors                      |
| `fix`       | Fix bugs in code                          |
| `test`      | Generate tests                            |
| `docs`      | Generate documentation                    |
| `search`    | Semantic code search                      |
| `status`    | Project status                            |
| `run`       | Execute terminal commands                 |
| `login`     | Configure API keys                        |
| `terminal`  | Integrated terminal                       |
| `session`   | Manage chat sessions                      |
| `providers` | List all AI providers                     |
| `agent`     | Run specific AI agents                    |
| `memory`    | View and manage memory                    |
| `plugins`   | Manage plugins                            |
| `update`    | Check for updates                         |
| `mcp`       | Manage MCP servers (list/add/remove/test) |

## AI Providers

| Provider        | Type         | Default Model                          | Env Variable          |
| --------------- | ------------ | -------------------------------------- | --------------------- |
| OpenRouter      | Free         | mistralai/mixtral-8x7b-instruct        | `OPENROUTER_API_KEY`  |
| Groq            | Free         | mixtral-8x7b-32768                     | `GROQ_API_KEY`        |
| Hugging Face    | Free         | mistralai/Mixtral-8x7B-Instruct-v0.1   | `HUGGINGFACE_API_KEY` |
| Ollama          | Free (local) | codellama                              | None                  |
| LM Studio       | Free (local) | local-model                            | None                  |
| DeepSeek        | Paid         | deepseek-v4-flash                      | `DEEPSEEK_API_KEY`    |
| OpenAI          | Paid         | gpt-4o                                 | `OPENAI_API_KEY`      |
| Anthropic       | Paid         | claude-sonnet-4-20250514               | `ANTHROPIC_API_KEY`   |
| Gemini          | Free         | gemini-2.5-flash                       | `GEMINI_API_KEY`      |
| Mistral         | Paid         | mistral-large-2501                     | `MISTRAL_API_KEY`     |
| Together AI     | Paid         | mistralai/Mixtral-8x7B-Instruct-v0.1   | `TOGETHER_API_KEY`    |
| Cerebras        | Paid         | llama3.1-8b                            | `CEREBRAS_API_KEY`    |
| Fireworks AI    | Paid         | llama-v3p1-405b-instruct               | `FIREWORKS_API_KEY`   |
| xAI             | Paid         | grok-3                                 | `XAI_API_KEY`         |
| NVIDIA Nemotron | Free         | nvidia/llama-3.1-nemotron-70b-instruct | `NVIDIA_API_KEY`      |
| Local GGUF      | Free (local) | local-model                            | None                  |

## Architecture

```
codestrike/
├── apps/
│   ├── cli/        # Terminal CLI (25 commands)
│   ├── web/        # Web IDE (Next.js 15)
│   ├── server/     # API Server (Fastify + WebSocket)
│   └── desktop/    # Desktop App (Electron)
├── packages/
│   ├── ai/         # 16 AI providers & routing
│   ├── agents/     # Multi-agent system (10 agents)
│   ├── core/       # Core types, errors, logging
│   ├── config/     # Configuration management
│   ├── database/   # Database connection
│   ├── git/        # Git operations
│   ├── mcp/        # Model Context Protocol client
│   ├── memory/     # Memory/session store
│   ├── plugins/    # Plugin system
│   ├── rag/        # RAG & project indexing
│   ├── shared/     # Shared types & utilities
│   ├── terminal/   # Terminal execution
│   ├── tools/      # File, shell & git tools
│   └── ui/         # UI components & themes
├── landing/        # Marketing site (Vite + React)
├── scripts/        # Installer, push scripts
├── docs/           # Documentation
└── index.html      # Landing page redirect
```

## Configuration

Set API keys via environment variables or `codestrike login`:

```env
# At least one provider key required (free options: Ollama, LM Studio, Groq, OpenRouter)
GROQ_API_KEY=gsk_your_key_here
```

Or use `codestrike login` for interactive setup.

## Development

```bash
git clone https://github.com/harshsharma-x/codestrike.git
cd codestrike
pnpm install
pnpm build
pnpm test                # 130+ tests across 21+ suites
pnpm dev                 # Development mode (all workspaces)
```

### Quick Start (2-terminal dev)

```bash
# Terminal 1 — Server
cd apps/server && pnpm dev

# Terminal 2 — Web
cd apps/web && pnpm dev
```

Then open http://localhost:3000 or http://localhost:4000/docs for the Swagger API browser.

## Docker

```bash
docker-compose up -d     # Start all services
```

## Links

- [GitHub](https://github.com/harshsharma-x/codestrike)
- [npm](https://www.npmjs.com/package/codestrike)
- [Docs](docs/)
- [Changelog](CHANGELOG.md)

## License

MIT — see [LICENSE](LICENSE)
