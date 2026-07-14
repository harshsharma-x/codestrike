import axios from 'axios';
import { BaseAIProvider } from './interface';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from '../types';
import { CodeStrikeError } from '@codestrike/core';

const DEFAULT_BASE_URL = 'https://api.mistral.ai/v1';
const ENV_KEY = 'MISTRAL_API_KEY';

export class MistralProvider extends BaseAIProvider {
  readonly name = 'mistral';
  readonly displayName = 'Mistral';
  readonly defaultModel = 'mistral-large-2501';
  readonly envKey = ENV_KEY;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super({ apiKey: config?.apiKey || process.env[ENV_KEY] || '', baseUrl: config?.baseUrl || DEFAULT_BASE_URL });
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const r = await axios.post(`${this.baseUrl}/chat/completions`, { ...this.buildBody(req), model: req.model || this.defaultModel }, { headers: this.buildHeaders(), timeout: 60000 });
      const d = r.data;
      return { id: d.id, content: d.choices[0].message.content, model: d.model, provider: 'mistral', tokens: { input: d.usage?.prompt_tokens || 0, output: d.usage?.completion_tokens || 0, total: d.usage?.total_tokens || 0 }, finishReason: d.choices[0].finish_reason || 'stop' };
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`Mistral error: ${error.response?.data?.error?.message || error.message}`, 'AI_PROVIDER_ERROR', error.response?.status || 500);
      throw error;
    }
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    try {
      const r = await axios.post(`${this.baseUrl}/chat/completions`, { ...this.buildBody(req), model: req.model || this.defaultModel, stream: true }, { headers: this.buildHeaders(), responseType: 'stream', timeout: 120000 });
      let buf = '';
      for await (const c of r.data) {
        buf += c.toString();
        for (const l of buf.split('\n').slice(0, -1)) {
          const t = l.trim();
          if (!t || t === 'data: [DONE]' || !t.startsWith('data: ')) continue;
          try { const j = JSON.parse(t.slice(6)); const d = j.choices?.[0]?.delta?.content; if (d) yield { content: d, done: false }; if (j.choices?.[0]?.finish_reason) yield { content: '', done: true, model: j.model }; } catch { /* */ }
        }
        buf = buf.split('\n').pop() || '';
      }
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`Mistral stream error: ${error.message}`, 'AI_PROVIDER_ERROR', 500);
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    try { const r = await axios.get(`${this.baseUrl}/models`, { headers: this.buildHeaders() }); return r.data.data?.map((m: { id: string }) => m.id) || []; } catch { return [this.defaultModel]; }
  }

  async validateConfig(): Promise<boolean> {
    try { await axios.get(`${this.baseUrl}/models`, { headers: this.buildHeaders(), timeout: 5000 }); return true; } catch { return !!this.apiKey; }
  }
}
