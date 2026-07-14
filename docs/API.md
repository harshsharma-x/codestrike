# CodeStrike API Documentation

## Base URL

```
http://localhost:4000/api
```

## Endpoints

### Health

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1700000000000,
  "version": "0.1.0"
}
```

### Chat

#### POST /api/chat/completions

Create a chat completion.

**Request:**
```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Write a function to calculate fibonacci" }
  ],
  "model": "mistralai/mixtral-8x7b-instruct",
  "provider": "openrouter",
  "stream": false
}
```

**Response (non-streaming):**
```json
{
  "id": "chatcmpl-abc123",
  "content": "Here's a fibonacci function:\n\n```typescript\nfunction fib(n: number): number {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}\n```",
  "model": "mistralai/mixtral-8x7b-instruct",
  "provider": "openrouter",
  "tokens": {
    "input": 50,
    "output": 120,
    "total": 170
  },
  "finishReason": "stop"
}
```

**Streaming response:** Server-Sent Events

```
data: {"content": "Here", "done": false}
data: {"content": "'s a", "done": false}
data: {"content": " fibonacci", "done": false}
data: {"content": " function...", "done": false}
data: [DONE]
```

#### GET /api/chat/models

List available models.

### Agents

#### GET /api/agents

List all available agents.

#### POST /api/agents/execute

Execute a single agent task.

**Request:**
```json
{
  "type": "coder",
  "prompt": "Create a React component for a todo list",
  "context": "Project uses TypeScript and Tailwind CSS"
}
```

#### POST /api/agents/execute-pipeline

Execute a pipeline of agent tasks.

**Request:**
```json
{
  "tasks": [
    { "type": "planner", "prompt": "Plan a user auth system" },
    { "type": "coder", "prompt": "Implement the auth system" },
    { "type": "reviewer", "prompt": "Review the auth implementation" }
  ]
}
```

### Projects

#### POST /api/projects/index

Index a project directory.

**Request:**
```json
{
  "rootDir": "/path/to/project"
}
```

#### GET /api/projects/search?query=database

Search indexed files.

#### GET /api/projects/status

Get indexing status.

#### GET /api/projects/structure

Get project tree structure.

### Git

#### GET /api/git/status

Get git repository status.

#### POST /api/git/commit

Create a commit.

**Request:**
```json
{
  "message": "feat: add user authentication",
  "files": ["src/auth.ts", "src/auth.test.ts"]
}
```

#### GET /api/git/diff

Get diff of changes.

#### GET /api/git/log?count=10

Get commit history.

### Terminal

#### POST /api/terminal/execute

Execute a terminal command.

**Request:**
```json
{
  "command": "npm run build",
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "stdout": "Building project...\nDone!",
  "stderr": "",
  "exitCode": 0
}
```

#### POST /api/terminal/cancel

Cancel a running command.

### Config

#### GET /api/config

Get project configuration.

#### POST /api/config

Save project configuration.

#### GET /api/config/env

Check environment variable status.

## MCP (Model Context Protocol)

### GET /api/mcp

List configured MCP servers.

### POST /api/mcp/connect

Connect an MCP server.

### POST /api/mcp/:name/disconnect

Disconnect an MCP server.

### GET /api/mcp/:name/tools

List tools provided by an MCP server.

### POST /api/mcp/:name/call

Call a tool on an MCP server.

## WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:4000/ws/terminal` | Real-time terminal with JSON messages |

Terminal WebSocket protocol:
```json
// Send
{ "command": "ls -la", "id": 1 }

// Receive
{ "type": "connected", "cwd": "/project" }
{ "type": "result", "id": 1, "stdout": "...", "stderr": "", "exitCode": 0 }
{ "type": "error", "message": "..." }
```

## Error Responses

```json
{
  "error": "Error type",
  "message": "Human-readable description"
}
```

HTTP Status Codes:
- `400` — Bad request
- `401` — Unauthorized
- `403` — Forbidden
- `429` — Rate limited
- `500` — Internal server error
- `502` — AI provider error
- `503` — Service unavailable
