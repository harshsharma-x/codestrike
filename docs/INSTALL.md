# CodeStrike Installation Guide

## Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 9.0.0 or later
- **Git** (for git integration)
- **Ollama** (optional, for local AI)

## One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/harshsharma-x/codestrike/main/scripts/install.sh | bash
```

## via npm

```bash
npm install -g codestrike
```

Verify:
```bash
codestrike --version
# 0.1.0
```

## From Source

```bash
git clone https://github.com/harshsharma-x/codestrike.git
cd codestrike
npm install
npm run build
npm link     # Link CLI for local testing
```

## Platform-Specific

### macOS
```bash
brew install node@20
brew install ollama  # optional
ollama pull codellama
```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
curl -fsSL https://ollama.ai/install.sh | sh  # optional
ollama pull codellama
```

### Windows
```bash
winget install OpenJS.NodeJS.LTS
# Or download from https://nodejs.org/
```

## Configure API Keys

```bash
codestrike login
```

Or set environment variables:

```bash
export GROQ_API_KEY=gsk_your_key_here
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

## Getting API Keys

| Provider | Sign Up | Free Tier |
|----------|---------|-----------|
| [OpenRouter](https://openrouter.ai/keys) | Free | 100+ models |
| [Groq](https://console.groq.com/keys) | Free | 30 req/min |
| [HuggingFace](https://huggingface.co/settings/tokens) | Free | Rate limited |
| [Gemini](https://aistudio.google.com/apikey) | Free | 60 req/min |
| [NVIDIA](https://build.nvidia.com/explore/discover) | Free | Rate limited |
| [DeepSeek](https://platform.deepseek.com/api_keys) | Paid | — |
| [OpenAI](https://platform.openai.com/api-keys) | Paid | — |
| [Anthropic](https://console.anthropic.com/) | Paid | — |

## Initialize

```bash
cd your-project
codestrike init
codestrike doctor  # Verify setup
```

## Local AI (Ollama)

```bash
ollama pull codellama
ollama pull deepseek-coder
ollama serve
```

## Verify

```bash
codestrike doctor
```

Expected output:
```
✓ Node.js version: v20.11.0
✓ Git installed
✓ codestrike.json found
✓ API keys configured
```

## Docker

```bash
docker-compose up -d
```

## Troubleshooting

### "command not found: codestrike"
```bash
npm config get prefix
export PATH=$(npm config get prefix)/bin:$PATH
```

### API key not working
```bash
codestrike doctor
```

### Ollama connection refused
```bash
ollama serve
curl http://localhost:11434/api/tags
```

### Build errors
```bash
npm run clean
npm run build
```
