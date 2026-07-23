import { AICompletionRequest, AICompletionResponse, AIStreamChunk, AIToolCall } from '../types';
import { ProviderRegistry, ProviderName } from '../providers/registry';
import { CodeStrikeError, Logger } from '@codestrike/core';

const logger = new Logger('AIRouter');

export interface RoutingConfig {
  primaryProvider: ProviderName;
  fallbackProviders: ProviderName[];
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export class AIRouter {
  private registry: ProviderRegistry;
  private config!: RoutingConfig;

  constructor(config: RoutingConfig) {
    this.registry = ProviderRegistry.getInstance();
    this.config = {
      primaryProvider: config.primaryProvider,
      fallbackProviders: config.fallbackProviders || [],
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const mcpTools = req.useMcp ? await this.loadMCPTools() : [];
    const request = mcpTools.length > 0 ? { ...req, tools: mcpTools } : { ...req, tools: req.tools ?? [] };

    const providers = this.getOrderedProviders();
    for (const [index, providerName] of providers.entries()) {
      try {
        const provider = this.registry.get(providerName);
        const finalReq = {
          ...request,
          provider: providerName,
          model: req.model || provider.defaultModel,
        };

        if (index > 0) {
          logger.warn(`Falling back to ${providerName} (attempt ${index + 1}/${providers.length})`);
        }

        return await this.withRetry(() => provider.complete(finalReq), providerName);
      } catch (error) {
        if (index === providers.length - 1) throw error;
        logger.warn(`Provider ${providerName} failed: ${error instanceof Error ? error.message : ''}`);
      }
    }
    throw new CodeStrikeError('All AI providers failed', 'AI_PROVIDER_ERROR');
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const mcpTools = req.useMcp ? await this.loadMCPTools() : [];
    const request = mcpTools.length > 0 ? { ...req, tools: mcpTools } : { ...req, tools: req.tools ?? [] };

    const providers = this.getOrderedProviders();
    for (const [index, providerName] of providers.entries()) {
      try {
        const provider = this.registry.get(providerName);
        const finalReq = {
          ...request,
          provider: providerName,
          model: req.model || provider.defaultModel,
        };

        if (index > 0) {
          logger.warn(`Falling back to ${providerName} for streaming`);
        }

        yield* this.withRetryStream(() => provider.stream(finalReq), providerName);
        return;
      } catch (error) {
        if (index === providers.length - 1) throw error;
        logger.warn(`Stream ${providerName} failed: ${error instanceof Error ? error.message : ''}`);
      }
    }
  }

  async completeWithTools(req: AICompletionRequest): Promise<AICompletionResponse> {
    const mcpTools = req.useMcp ? await this.loadMCPTools() : [];
    const messages = [...req.messages];
    const maxTurns = 5;

    for (let turn = 0; turn < maxTurns; turn++) {
      const request = mcpTools.length > 0 ? { ...req, messages, tools: mcpTools } : { ...req, messages };
      const result = await this.complete(request);
      const toolCalls = this.extractToolCalls(result);

      if (!toolCalls || toolCalls.length === 0) return result;

      messages.push({ role: 'assistant', content: result.content });

      for (const call of toolCalls) {
        try {
          const mcpResult = await this.executeMCPTool(call);
          messages.push({ role: 'tool', content: JSON.stringify(mcpResult), toolCallId: call.id });
        } catch (error) {
          messages.push({ role: 'tool', content: `Error: ${String(error)}`, toolCallId: call.id });
        }
      }
    }

    return this.complete({ ...req, messages });
  }

  async *streamWithTools(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const mcpTools = req.useMcp ? await this.loadMCPTools() : [];
    const messages = [...req.messages];
    const maxTurns = 5;

    for (let turn = 0; turn < maxTurns; turn++) {
      const request = mcpTools.length > 0 ? { ...req, messages, tools: mcpTools } : { ...req, messages };
      let fullContent = '';
      let pendingToolCalls: AIToolCall[] = [];

      const stream = this.stream(request);
      for await (const chunk of stream) {
        fullContent += chunk.content;
        if (chunk.toolCalls) pendingToolCalls = chunk.toolCalls;
        yield chunk;
      }

      if (pendingToolCalls.length === 0) return;

      messages.push({ role: 'assistant', content: fullContent });

      for (const call of pendingToolCalls) {
        try {
          const mcpResult = await this.executeMCPTool(call);
          messages.push({ role: 'tool', content: JSON.stringify(mcpResult), toolCallId: call.id });
        } catch (error) {
          messages.push({ role: 'tool', content: `Error: ${String(error)}`, toolCallId: call.id });
        }
      }
    }
  }

  private async loadMCPTools(): Promise<{ name: string; description: string; inputSchema: Record<string, unknown> }[]> {
    try {
      const { MCPRegistry } = await import('@codestrike/mcp');
      const registry = MCPRegistry.getInstance();
      const tools = await registry.getAllTools();
      return tools.map(t => ({
        name: `${t.serverName}_${t.name}`,
        description: t.description,
        inputSchema: t.inputSchema as Record<string, unknown>,
      }));
    } catch {
      return [];
    }
  }

  private async executeMCPTool(call: AIToolCall): Promise<{ content: string }> {
    const { MCPRegistry } = await import('@codestrike/mcp');
    const registry = MCPRegistry.getInstance();
    const dotIndex = call.name.indexOf('_');
    if (dotIndex === -1) throw new Error(`Invalid MCP tool name: ${call.name}`);
    const serverName = call.name.slice(0, dotIndex);
    const toolName = call.name.slice(dotIndex + 1);
    const result = await registry.callTool(serverName, toolName, call.arguments);
    return { content: result.content?.map((c: any) => c.text || '').join('\n') || '' };
  }

  private extractToolCalls(response: AICompletionResponse): AIToolCall[] | undefined {
    return (response as any).toolCalls;
  }

  private getOrderedProviders(): ProviderName[] {
    const providers: ProviderName[] = [this.config.primaryProvider];
    if (this.config.fallbackProviders) providers.push(...this.config.fallbackProviders);
    return providers;
  }

  private async withRetry<T>(fn: () => Promise<T>, providerName: string): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try { return await fn(); } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }
    throw lastError || new CodeStrikeError(`Provider ${providerName} failed after retries`, 'AI_PROVIDER_ERROR');
  }

  private async *withRetryStream(fn: () => AsyncGenerator<AIStreamChunk>, providerName: string): AsyncGenerator<AIStreamChunk> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try { yield* fn(); return; } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        } else { throw lastError; }
      }
    }
  }
}

export function createRouter(config?: Partial<RoutingConfig>): AIRouter {
  const defaultConfig: RoutingConfig = {
    primaryProvider: 'openrouter',
    fallbackProviders: ['groq', 'huggingface', 'ollama'],
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 1000,
  };
  return new AIRouter({ ...defaultConfig, ...config });
}
