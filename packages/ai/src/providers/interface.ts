import { AICompletionRequest, AICompletionResponse, AIStreamChunk, AIToolCall, AIToolDefinition } from '../types';

export interface AIProvider {
  readonly name: string;
  readonly displayName: string;
  readonly defaultModel: string;
  readonly envKey: string;
  readonly supportsTools: boolean;

  complete(req: AICompletionRequest): Promise<AICompletionResponse>;
  stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk>;
  validateConfig(): Promise<boolean>;
  listModels?(): Promise<string[]>;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly defaultModel: string;
  abstract readonly envKey: string;
  readonly supportsTools = false;
  protected baseUrl: string;
  protected apiKey: string;

  abstract complete(req: AICompletionRequest): Promise<AICompletionResponse>;
  abstract stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk>;

  constructor(config?: { apiKey?: string; baseUrl?: string; defaultBaseUrl?: string }) {
    this.apiKey = config?.apiKey || '';
    this.baseUrl = config?.baseUrl || config?.defaultBaseUrl || '';
  }

  async validateConfig(): Promise<boolean> {
    return !!this.apiKey;
  }

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  protected buildBody(req: AICompletionRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: req.model,
      messages: req.messages.map(m => ({ role: m.role, content: m.content })),
      stream: req.stream ?? false,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 4096,
    };
    if (req.tools && req.tools.length > 0 && this.supportsTools) {
      body.tools = req.tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      }));
    }
    return body;
  }

  protected parseToolCalls(response: any): AIToolCall[] | undefined {
    if (!response.choices?.[0]?.message?.tool_calls) return undefined;
    return response.choices[0].message.tool_calls.map((tc: any) => ({
      id: tc.id,
      name: tc.function?.name || '',
      arguments: JSON.parse(tc.function?.arguments || '{}'),
    }));
  }

  protected supportedToolProviders = ['openai', 'anthropic', 'gemini', 'mistral', 'together', 'cerebras', 'fireworks', 'xai', 'groq', 'deepseek'];
}
