import { createRouter } from '@codestrike/ai';
import { ProviderRegistry } from '@codestrike/ai';

export interface ChatRequest {
  messages: { role: string; content: string }[];
  model?: string;
  provider?: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  tokens: { input: number; output: number; total: number };
  finishReason: string;
}

export async function processChatCompletion(req: ChatRequest): Promise<ChatResponse> {
  const router = createRouter({
    primaryProvider: (req.provider as any) || 'openrouter',
  });

  const response = await router.complete({
    messages: req.messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
    model: req.model || 'mistralai/mixtral-8x7b-instruct',
    provider: (req.provider as any) || 'openrouter',
    stream: false,
    temperature: req.temperature,
    maxTokens: req.maxTokens,
  });

  return {
    id: response.id,
    content: response.content,
    model: response.model,
    provider: response.provider as string,
    tokens: response.tokens,
    finishReason: response.finishReason,
  };
}

export async function* streamChatCompletion(req: ChatRequest): AsyncGenerator<string> {
  const router = createRouter({
    primaryProvider: (req.provider as any) || 'openrouter',
  });

  const stream = router.stream({
    messages: req.messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
    model: req.model || 'mistralai/mixtral-8x7b-instruct',
    provider: (req.provider as any) || 'openrouter',
    stream: true,
    temperature: req.temperature,
    maxTokens: req.maxTokens,
  });

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content;
    }
  }
}

export function getAvailableModels() {
  const registry = ProviderRegistry.getInstance();
  return registry.getAvailableProviders().map(name => ({
    name,
    displayName: registry.get(name).displayName,
    defaultModel: registry.get(name).defaultModel,
  }));
}
