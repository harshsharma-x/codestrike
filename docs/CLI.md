# CodeStrike CLI Documentation

## Installation

```bash
npm install -g codestrike

# Or one-liner:
curl -fsSL https://raw.githubusercontent.com/harshsharma-x/codestrike/main/scripts/install.sh | bash
```

Verify:
```bash
codestrike --version
```

## Commands (25 total + 4 MCP subcommands)

### `codestrike init`
Initialize CodeStrike in the current project.
```bash
codestrike init
codestrike init -y  # Accept all defaults
```

### `codestrike chat`
Start an interactive AI chat session.
```bash
codestrike chat
codestrike chat "Explain this error"
codestrike chat -m "codellama" -p "ollama"
```

Options:
- `-m, --model <model>` — AI model to use
- `-p, --provider <provider>` — AI provider

### `codestrike login`
Configure API keys interactively.
```bash
codestrike login
codestrike login -p openai  # Configure specific provider
```

### `codestrike providers`
List all 16 AI providers with their models and env variable names.
```bash
codestrike providers
```

### `codestrike models`
List available AI models and providers.
```bash
codestrike models
codestrike models -p groq  # Filter by provider
```

### `codestrike doctor`
Run system diagnostics (Node, Git, API keys, config).
```bash
codestrike doctor
```

### `codestrike config`
View or modify configuration.
```bash
codestrike config
codestrike config --set provider=ollama
```

### `codestrike index`
Index the current project for AI context.
```bash
codestrike index
codestrike index --reindex  # Force re-index
```

### `codestrike session`
Manage chat sessions.
```bash
codestrike session list
codestrike session show <id>
codestrike session delete <id>
```

### `codestrike memory`
View and manage AI memory.
```bash
codestrike memory show <key>
codestrike memory set <key> <value>
codestrike memory list
```

### `codestrike agent`
Run specific AI agents.
```bash
codestrike agent coder "Create a React component"
codestrike agent planner "Plan authentication system"
```

### `codestrike plugins`
Manage CodeStrike plugins.
```bash
codestrike plugins list
codestrike plugins add <path>
codestrike plugins remove <name>
```

### `codestrike update`
Check for CodeStrike updates.
```bash
codestrike update
```

### `codestrike review`
Review code in the project.
```bash
codestrike review src/app.ts
codestrike review --all
```

### `codestrike commit`
Generate commit messages from staged changes.
```bash
git add .
codestrike commit
codestrike commit -y  # Skip confirmation
```

### `codestrike explain`
Explain code or concepts.
```bash
codestrike explain "What does this code do?"
codestrike explain -f src/server.ts
```

### `codestrike debug`
Debug code or errors.
```bash
codestrike debug "Error: EACCES"
codestrike debug -f src/config.ts
```

### `codestrike fix`
Fix bugs or issues in code.
```bash
codestrike fix src/buggy.ts
```

### `codestrike test`
Generate tests for code.
```bash
codestrike test src/utils.ts
codestrike test src/utils.ts -f jest
```

### `codestrike docs`
Generate documentation.
```bash
codestrike docs src/*.ts
codestrike docs --all
```

### `codestrike search`
Semantic code search.
```bash
codestrike search "database connection"
codestrike search "error handling" -l 5
```

### `codestrike status`
Show project status (config, git, index).
```bash
codestrike status
```

### `codestrike run`
Execute terminal commands.
```bash
codestrike run "npm run build"
```

### `codestrike terminal`
Start an integrated terminal.
```bash
codestrike terminal
```

### `codestrike mcp`
Manage MCP (Model Context Protocol) servers.
```bash
codestrike mcp list
codestrike mcp add my-server --command npx --args '-y @modelcontextprotocol/server-filesystem /tmp'
codestrike mcp remove my-server
codestrike mcp test my-server
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `GROQ_API_KEY` | Groq API key |
| `HUGGINGFACE_API_KEY` | Hugging Face API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GEMINI_API_KEY` | Gemini API key |
| `MISTRAL_API_KEY` | Mistral API key |
| `TOGETHER_AI_API_KEY` | Together AI API key |
| `CEREBRAS_API_KEY` | Cerebras API key |
| `FIREWORKS_AI_API_KEY` | Fireworks AI API key |
| `XAI_API_KEY` | xAI API key |
| `NVIDIA_NEMOTRON_API_KEY` | NVIDIA Nemotron API key |
| `OLLAMA_HOST` | Ollama host (default: http://localhost:11434) |
| `LMSTUDIO_HOST` | LM Studio host (default: http://localhost:1234/v1) |
| `CODESTRIKE_CONFIG_DIR` | Config directory (default: ~/.codestrike) |

## Configuration File

`codestrike.json`:
```json
{
  "name": "my-project",
  "rootDir": "/path/to/project",
  "model": "mistralai/mixtral-8x7b-instruct",
  "provider": "openrouter",
  "ignorePatterns": ["node_modules/**", ".git/**", "dist/**"],
  "temperature": 0.7,
  "maxTokens": 4096
}
```
