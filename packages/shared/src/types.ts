export type AIProvider = 'openrouter' | 'groq' | 'huggingface' | 'ollama' | 'lmstudio';
export type AIProviderStatus = 'online' | 'offline' | 'rate_limited' | 'error';
export type AIModel = string;
export type Role = 'system' | 'user' | 'assistant' | 'tool';
export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  status: MessageStatus;
  model?: string;
  provider?: AIProvider;
  tokens?: number;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  provider: AIProvider;
  projectId?: string;
  context?: string;
  systemPrompt?: string;
}

export interface AIRequest {
  messages: { role: Role; content: string }[];
  model: string;
  provider: AIProvider;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  finishReason: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  model?: string;
  tokens?: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  model: string;
  provider: AIProvider;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export type AgentRole =
  | 'planner'
  | 'architect'
  | 'coder'
  | 'reviewer'
  | 'debugger'
  | 'security'
  | 'documentation'
  | 'testing'
  | 'git'
  | 'deployment';

export interface AgentTask {
  id: string;
  agentId: string;
  type: AgentRole;
  prompt: string;
  context: string;
  files?: string[];
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  parentTaskId?: string;
  subTasks?: AgentTask[];
}

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete' | 'rename';
  oldPath?: string;
  content?: string;
  diff?: string;
  language?: string;
}

export interface IndexEntry {
  id: string;
  path: string;
  content: string;
  summary: string;
  language: string;
  tokens: number;
  embeddings?: number[];
  lastIndexed: number;
  dependencies: string[];
  exports: string[];
  imports: string[];
}

export interface ProjectConfig {
  name: string;
  rootDir: string;
  model: string;
  provider: AIProvider;
  systemPrompt?: string;
  ignorePatterns?: string[];
  temperature?: number;
  maxTokens?: number;
}

export interface UserConfig {
  apiKeys: Partial<Record<AIProvider, string>>;
  defaultProvider: AIProvider;
  defaultModel: string;
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  telemetry: boolean;
  autoIndex: boolean;
  gitIntegration: boolean;
  terminalIntegration: boolean;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicts: string[];
  currentHash: string;
  lastCommitMessage: string;
}

export interface TerminalSession {
  id: string;
  cwd: string;
  commands: number;
  createdAt: number;
  lastActive: number;
}

export interface ApiKey {
  provider: AIProvider;
  key: string;
  isValid: boolean;
  lastValidated: number;
}

export interface ProjectIndex {
  id: string;
  projectRoot: string;
  entries: number;
  lastIndexed: number;
  status: 'idle' | 'indexing' | 'ready' | 'error';
  error?: string;
}

export interface PipelineStep {
  id: string;
  agentRole: AgentRole;
  prompt: string;
  context?: string;
  dependsOn?: string[];
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  createdAt: number;
}

export interface PipelineTemplate {
  name: string;
  description: string;
  steps: { agentRole: AgentRole; prompt: string; dependsOn?: string[] }[];
}

export const PIPELINE_TEMPLATES: Record<string, PipelineTemplate> = {
  'secure-feature': {
    name: 'Secure Feature',
    description: 'Architect → Code → Security review → Deploy',
    steps: [
      { agentRole: 'architect', prompt: 'Design the architecture for: {{task}}' },
      {
        agentRole: 'coder',
        prompt: 'Implement the following architecture design:\n{{previous}}',
        dependsOn: ['step-0'],
      },
      {
        agentRole: 'security',
        prompt: 'Review the following code for security vulnerabilities:\n{{previous}}',
        dependsOn: ['step-1'],
      },
      {
        agentRole: 'deployment',
        prompt: 'Create deployment configuration for:\n{{previous}}',
        dependsOn: ['step-2'],
      },
    ],
  },
  'full-review': {
    name: 'Full Review',
    description: 'Review → Security audit → Documentation → Testing',
    steps: [
      { agentRole: 'reviewer', prompt: 'Review the following code:\n{{task}}' },
      {
        agentRole: 'security',
        prompt: 'Audit the following for security issues:\n{{previous}}',
        dependsOn: ['step-0'],
      },
      {
        agentRole: 'documentation',
        prompt: 'Generate documentation for:\n{{previous}}',
        dependsOn: ['step-0', 'step-1'],
      },
      {
        agentRole: 'testing',
        prompt: 'Generate test plan and tests for:\n{{previous}}',
        dependsOn: ['step-0', 'step-1'],
      },
    ],
  },
  'debug-triage': {
    name: 'Debug Triage',
    description: 'Debug → Fix → Test',
    steps: [
      { agentRole: 'debugger', prompt: 'Debug the following issue:\n{{task}}' },
      {
        agentRole: 'coder',
        prompt: 'Fix the bug identified:\n{{previous}}',
        dependsOn: ['step-0'],
      },
      {
        agentRole: 'testing',
        prompt: 'Verify the fix with tests:\n{{previous}}',
        dependsOn: ['step-1'],
      },
    ],
  },
  'docs-gen': {
    name: 'Documentation Generation',
    description: 'Read code → Document → Review docs',
    steps: [
      { agentRole: 'documentation', prompt: 'Generate documentation for:\n{{task}}' },
      {
        agentRole: 'reviewer',
        prompt: 'Review the following documentation for accuracy:\n{{previous}}',
        dependsOn: ['step-0'],
      },
    ],
  },
  'code-to-deploy': {
    name: 'Code to Deploy',
    description: 'Plan → Code → Review → Deploy',
    steps: [
      { agentRole: 'planner', prompt: 'Create a plan for: {{task}}' },
      {
        agentRole: 'coder',
        prompt: 'Implement based on this plan:\n{{previous}}',
        dependsOn: ['step-0'],
      },
      {
        agentRole: 'reviewer',
        prompt: 'Review the implementation:\n{{previous}}',
        dependsOn: ['step-1'],
      },
      {
        agentRole: 'deployment',
        prompt: 'Configure deployment for:\n{{previous}}',
        dependsOn: ['step-2'],
      },
    ],
  },
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type ThemeMode = 'dark' | 'light' | 'system';
export type CommandStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';
