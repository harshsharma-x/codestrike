import axios from 'axios';
import { BaseAIProvider } from './interface';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from '../types';
import { CodeStrikeError } from '@codestrike/core';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const ENV_KEY = 'OPENROUTER_API_KEY';

export class OpenRouterProvider extends BaseAIProvider {
  readonly name = 'openrouter';
  readonly displayName = 'OpenRouter';
  readonly defaultModel = 'mistralai/mixtral-8x7b-instruct';
  readonly envKey = ENV_KEY;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super({
      apiKey: config?.apiKey || process.env[ENV_KEY] || '',
      baseUrl: config?.baseUrl || DEFAULT_BASE_URL,
    });
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        { ...this.buildBody(req), model: req.model || this.defaultModel },
        {
          headers: { ...this.buildHeaders(), 'HTTP-Referer': 'https://codestrike.ai', 'X-Title': 'CodeStrike AI' },
          timeout: 60000,
        },
      );
      const d = response.data;
      return {
        id: d.id, content: d.choices[0].message.content, model: d.model, provider: 'openrouter',
        tokens: { input: d.usage?.prompt_tokens || 0, output: d.usage?.completion_tokens || 0, total: d.usage?.total_tokens || 0 },
        finishReason: d.choices[0].finish_reason || 'stop',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`OpenRouter error: ${error.response?.data?.error?.message || error.message}`, 'AI_PROVIDER_ERROR', error.response?.status || 500);
      throw error;
    }
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        { ...this.buildBody(req), model: req.model || this.defaultModel, stream: true },
        {
          headers: { ...this.buildHeaders(), 'HTTP-Referer': 'https://codestrike.ai', 'X-Title': 'CodeStrike AI' },
          responseType: 'stream', timeout: 120000,
        },
      );
      let buffer = '';
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        for (const line of buffer.split('\n').slice(0, -1)) {
          const t = line.trim();
          if (!t || t === 'data: [DONE]' || !t.startsWith('data: ')) continue;
          try {
            const j = JSON.parse(t.slice(6));
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) yield { content: delta, done: false };
            if (j.choices?.[0]?.finish_reason) yield { content: '', done: true, model: j.model };
          } catch { /* skip */ }
        }
        buffer = buffer.split('\n').pop() || '';
      }
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`OpenRouter stream error: ${error.message}`, 'AI_PROVIDER_ERROR', 500);
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const r = await axios.get(`${this.baseUrl}/models`, { headers: this.buildHeaders() });
      return r.data.data?.map((m: { id: string }) => m.id) || [];
    } catch { return [this.defaultModel]; }
  }
}
