import axios from 'axios';
import { BaseAIProvider } from './interface';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from '../types';
import { CodeStrikeError } from '@codestrike/core';

const DEFAULT_BASE_URL = 'https://api-inference.huggingface.co/models';
const ENV_KEY = 'HUGGINGFACE_API_KEY';

export class HuggingFaceProvider extends BaseAIProvider {
  readonly name = 'huggingface';
  readonly displayName = 'Hugging Face';
  readonly defaultModel = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
  readonly envKey = ENV_KEY;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super({ apiKey: config?.apiKey || process.env[ENV_KEY] || '', baseUrl: config?.baseUrl || DEFAULT_BASE_URL });
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/${model}/v1/chat/completions`, { model, messages: req.messages, max_tokens: req.maxTokens || 4096, temperature: req.temperature || 0.7 }, { headers: this.buildHeaders(), timeout: 120000 });
      const d = r.data;
      return { id: d.id || `hf-${Date.now()}`, content: d.choices?.[0]?.message?.content || '', model, provider: 'huggingface', tokens: { input: d.usage?.prompt_tokens || 0, output: d.usage?.completion_tokens || 0, total: d.usage?.total_tokens || 0 }, finishReason: d.choices?.[0]?.finish_reason || 'stop' };
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`HuggingFace error: ${error.response?.data?.error || error.message}`, 'AI_PROVIDER_ERROR', error.response?.status || 500);
      throw error;
    }
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/${model}/v1/chat/completions`, { model, messages: req.messages, max_tokens: req.maxTokens || 4096, temperature: req.temperature || 0.7, stream: true }, { headers: this.buildHeaders(), responseType: 'stream', timeout: 180000 });
      let buf = '';
      for await (const c of r.data) { buf += c.toString(); for (const l of buf.split('\n').slice(0, -1)) { const t = l.trim(); if (!t || t === 'data: [DONE]' || !t.startsWith('data: ')) continue; try { const j = JSON.parse(t.slice(6)); const d = j.choices?.[0]?.delta?.content; if (d) yield { content: d, done: false }; if (j.choices?.[0]?.finish_reason) yield { content: '', done: true, model: j.model }; } catch { /* */ } } buf = buf.split('\n').pop() || ''; }
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`HuggingFace stream error: ${error.message}`, 'AI_PROVIDER_ERROR', 500);
      throw error;
    }
  }
}
