import axios from 'axios';
import { BaseAIProvider } from './interface';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from '../types';
import { CodeStrikeError } from '@codestrike/core';

const DEFAULT_BASE_URL = 'http://localhost:1234/v1';
const ENV_KEY = 'LMSTUDIO_HOST';

export class LMStudioProvider extends BaseAIProvider {
  readonly name = 'lmstudio';
  readonly displayName = 'LM Studio';
  readonly defaultModel = 'local-model';
  readonly envKey = ENV_KEY;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super({ apiKey: config?.apiKey || '', baseUrl: config?.baseUrl || process.env[ENV_KEY] || DEFAULT_BASE_URL });
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/chat/completions`, { model, messages: req.messages, temperature: req.temperature || 0.7, max_tokens: req.maxTokens || 4096 }, { headers: this.buildHeaders(), timeout: 120000 });
      const d = r.data;
      return { id: d.id || `lmstudio-${Date.now()}`, content: d.choices?.[0]?.message?.content || '', model: d.model || model, provider: 'lmstudio', tokens: { input: d.usage?.prompt_tokens || 0, output: d.usage?.completion_tokens || 0, total: d.usage?.total_tokens || 0 }, finishReason: d.choices?.[0]?.finish_reason || 'stop' };
    } catch (error) {
      if (axios.isAxiosError(error)) { if (error.code === 'ECONNREFUSED') throw new CodeStrikeError('LM Studio not running. Start LM Studio and enable API server.', 'AI_PROVIDER_OFFLINE', 503); throw new CodeStrikeError(`LM Studio error: ${error.message}`, 'AI_PROVIDER_ERROR', 500); }
      throw error;
    }
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/chat/completions`, { model, messages: req.messages, temperature: req.temperature || 0.7, max_tokens: req.maxTokens || 4096, stream: true }, { headers: this.buildHeaders(), responseType: 'stream', timeout: 180000 });
      let buf = '';
      for await (const c of r.data) { buf += c.toString(); for (const l of buf.split('\n').slice(0, -1)) { const t = l.trim(); if (!t || t === 'data: [DONE]' || !t.startsWith('data: ')) continue; try { const j = JSON.parse(t.slice(6)); const d = j.choices?.[0]?.delta?.content; if (d) yield { content: d, done: false }; if (j.choices?.[0]?.finish_reason) yield { content: '', done: true, model: j.model }; } catch { /* */ } } buf = buf.split('\n').pop() || ''; }
    } catch (error) {
      if (axios.isAxiosError(error)) { if (error.code === 'ECONNREFUSED') throw new CodeStrikeError('LM Studio not running.', 'AI_PROVIDER_OFFLINE', 503); throw new CodeStrikeError(`LM Studio stream error: ${error.message}`, 'AI_PROVIDER_ERROR', 500); }
      throw error;
    }
  }

  async listModels(): Promise<string[]> { try { const r = await axios.get(`${this.baseUrl}/models`, { timeout: 5000 }); return r.data.data?.map((m: { id: string }) => m.id) || [this.defaultModel]; } catch { return [this.defaultModel]; } }
  async validateConfig(): Promise<boolean> { try { await axios.get(`${this.baseUrl}/models`, { timeout: 5000 }); return true; } catch { return false; } }
}
