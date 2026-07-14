import { AIProvider } from '@codestrike/shared';

export interface DefaultConfig {
  provider: AIProvider;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  ignorePatterns: string[];
}

export const DEFAULT_CONFIG: DefaultConfig = {
  provider: 'openrouter',
  model: 'mistralai/mixtral-8x7b-instruct',
  systemPrompt: 'You are CodeStrike AI, an expert programming assistant.',
  temperature: 0.7,
  maxTokens: 4096,
  ignorePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '.next/**',
    'coverage/**',
    '*.lock',
  ],
};

export function getDefaultModelForProvider(provider: AIProvider): string {
  const models: Record<AIProvider, string> = {
    openrouter: 'mistralai/mixtral-8x7b-instruct',
    groq: 'mixtral-8x7b-32768',
    huggingface: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ollama: 'codellama',
    lmstudio: 'local-model',
  };
  return models[provider] || models.openrouter;
}
