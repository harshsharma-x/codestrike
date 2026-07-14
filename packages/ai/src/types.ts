import { z } from 'zod';

const PROVIDERS = ['openrouter', 'groq', 'huggingface', 'ollama', 'lmstudio', 'deepseek', 'openai', 'anthropic', 'gemini', 'mistral', 'together', 'cerebras', 'fireworks', 'xai', 'nemotron', 'gguf'] as const;

export const AICompletionRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.string(),
    toolCallId: z.string().optional(),
  })).min(1),
  model: z.string(),
  provider: z.enum(PROVIDERS),
  stream: z.boolean().default(false),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  systemPrompt: z.string().optional(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.record(z.unknown()),
  })).optional(),
  useMcp: z.boolean().optional(),
});

export const AICompletionResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  model: z.string(),
  provider: z.enum(PROVIDERS),
  tokens: z.object({
    input: z.number(),
    output: z.number(),
    total: z.number(),
  }),
  finishReason: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
});

export type AICompletionRequest = z.infer<typeof AICompletionRequestSchema>;
export type AICompletionResponse = z.infer<typeof AICompletionResponseSchema>;

export interface AIToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIToolResult {
  toolCallId: string;
  name: string;
  content: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  model?: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  toolCalls?: AIToolCall[];
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  baseUrl: string;
  defaultModel: string;
  free: boolean;
  capabilities: string[];
  envKey: string;
}
