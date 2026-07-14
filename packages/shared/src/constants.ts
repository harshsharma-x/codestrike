export const CODESTRIKE_VERSION = '0.1.0';

export const DEFAULT_SYSTEM_PROMPT = `You are CodeStrike AI, an expert programming assistant integrated into the user's terminal and IDE. You help with coding tasks including writing, debugging, refactoring, explaining, and reviewing code. You can operate across entire projects, understand repository structure, and make file changes.`;

export const PROVIDER_INFO: Record<string, { name: string; baseUrl: string; defaultModel: string; free: boolean }> = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'mistralai/mixtral-8x7b-instruct',
    free: true,
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'mixtral-8x7b-32768',
    free: true,
  },
  huggingface: {
    name: 'Hugging Face',
    baseUrl: 'https://api-inference.huggingface.co/models',
    defaultModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    free: true,
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'codellama',
    free: true,
  },
  lmstudio: {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    free: true,
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v4-flash',
    free: false,
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    free: false,
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-20250514',
    free: false,
  },
  gemini: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    free: true,
  },
  mistral: {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-2501',
    free: false,
  },
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    free: false,
  },
  cerebras: {
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama3.1-8b',
    free: false,
  },
  fireworks: {
    name: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultModel: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
    free: false,
  },
  xai: {
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3',
    free: false,
  },
  nemotron: {
    name: 'NVIDIA Nemotron',
    baseUrl: 'https://api.nvcf.nvidia.com/v2/nvcf',
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    free: true,
  },
  gguf: {
    name: 'Local GGUF',
    baseUrl: 'http://localhost:8080/v1',
    defaultModel: 'local-model',
    free: true,
  },
};

export const AGENT_ROLES = [
  'planner',
  'architect',
  'coder',
  'reviewer',
  'debugger',
  'security',
  'documentation',
  'testing',
  'git',
  'deployment',
] as const;

export const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'python', 'rust', 'go', 'java',
  'c', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin',
  'scala', 'elixir', 'haskell', 'clojure', 'lua', 'perl',
  'r', 'matlab', 'sql', 'html', 'css', 'scss', 'json', 'yaml',
  'markdown', 'bash', 'dockerfile', 'graphql', 'proto',
];

export const ERROR_CODES = {
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_PROVIDER_RATE_LIMIT: 'AI_PROVIDER_RATE_LIMIT',
  AI_PROVIDER_TIMEOUT: 'AI_PROVIDER_TIMEOUT',
  AI_PROVIDER_OFFLINE: 'AI_PROVIDER_OFFLINE',
  INVALID_API_KEY: 'INVALID_API_KEY',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  INDEX_NOT_FOUND: 'INDEX_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  COMMAND_FAILED: 'COMMAND_FAILED',
  GIT_ERROR: 'GIT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  '*.log',
  '*.lock',
  '*.map',
  'coverage/**',
  '.turbo/**',
  '.cache/**',
];

export const MAX_FILE_SIZE = 1024 * 1024; // 1MB
export const MAX_CONTEXT_LENGTH = 128000;
export const MAX_CHUNK_SIZE = 8000;
export const EMBEDDING_DIMENSION = 1536;
export const STREAM_CHUNK_SIZE = 100;
export const CACHE_TTL = 3600;
export const SESSION_TIMEOUT = 3600000; // 1 hour
