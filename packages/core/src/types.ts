import { z } from 'zod';

export const MCPServerConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  transport: z.enum(['stdio', 'http']),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  enabled: z.boolean().default(true),
});
export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

export const UserConfigSchema = z.object({
  apiKeys: z.record(z.string(), z.string()).default({}),
  defaultProvider: z.enum(['openrouter', 'groq', 'huggingface', 'ollama', 'lmstudio']).default('openrouter'),
  defaultModel: z.string().default('mistralai/mixtral-8x7b-instruct'),
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  fontSize: z.number().min(10).max(24).default(14),
  telemetry: z.boolean().default(false),
  autoIndex: z.boolean().default(true),
  gitIntegration: z.boolean().default(true),
  terminalIntegration: z.boolean().default(true),
  mcpServers: z.array(MCPServerConfigSchema).default([]),
});

export const ProjectConfigSchema = z.object({
  name: z.string(),
  rootDir: z.string(),
  model: z.string().optional(),
  provider: z.enum(['openrouter', 'groq', 'huggingface', 'ollama', 'lmstudio']).optional(),
  systemPrompt: z.string().optional(),
  ignorePatterns: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(128000).optional(),
});

export const AIModelConfigSchema = z.object({
  provider: z.enum(['openrouter', 'groq', 'huggingface', 'ollama', 'lmstudio']),
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(128000).default(4096),
  stream: z.boolean().default(true),
});

export type UserConfig = z.infer<typeof UserConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type AIModelConfig = z.infer<typeof AIModelConfigSchema>;

export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  embeddings: boolean;
  maxContextLength: number;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  defaultModel: string;
  capabilities: ProviderCapabilities;
  envKey: string;
}
