import axios from 'axios';
import { BaseAIProvider } from './interface';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from '../types';
import { CodeStrikeError } from '@codestrike/core';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const ENV_KEY = 'OLLAMA_HOST';

export class OllamaProvider extends BaseAIProvider {
  readonly name = 'ollama';
  readonly displayName = 'Ollama';
  readonly defaultModel = 'codellama';
  readonly envKey = ENV_KEY;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super({ apiKey: '', baseUrl: config?.baseUrl || process.env[ENV_KEY] || DEFAULT_BASE_URL });
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/api/chat`, { model, messages: req.messages, stream: false, options: { temperature: req.temperature || 0.7, num_predict: req.maxTokens || 4096 } }, { timeout: 120000 });
      const d = r.data;
      return { id: `ollama-${Date.now()}`, content: d.message?.content || '', model: d.model || model, provider: 'ollama', tokens: { input: 0, output: 0, total: 0 }, finishReason: d.done ? 'stop' : 'unknown' };
    } catch (error) {
      if (axios.isAxiosError(error)) { if (error.code === 'ECONNREFUSED') throw new CodeStrikeError('Ollama not running. Run: ollama serve', 'AI_PROVIDER_OFFLINE', 503); throw new CodeStrikeError(`Ollama error: ${error.message}`, 'AI_PROVIDER_ERROR', 500); }
      throw error;
    }
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/api/chat`, { model, messages: req.messages, stream: true, options: { temperature: req.temperature || 0.7, num_predict: req.maxTokens || 4096 } }, { responseType: 'stream', timeout: 180000 });
      let buf = '';
      for await (const c of r.data) { buf += c.toString(); for (const l of buf.split('\n').slice(0, -1)) { const t = l.trim(); if (!t) continue; try { const j = JSON.parse(t); if (j.message?.content) yield { content: j.message.content, done: false }; if (j.done) yield { content: '', done: true, model: j.model }; } catch { /* */ } } buf = buf.split('\n').pop() || ''; }
    } catch (error) {
      if (axios.isAxiosError(error)) { if (error.code === 'ECONNREFUSED') throw new CodeStrikeError('Ollama not running. Run: ollama serve', 'AI_PROVIDER_OFFLINE', 503); throw new CodeStrikeError(`Ollama stream error: ${error.message}`, 'AI_PROVIDER_ERROR', 500); }
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    try { const r = await axios.get(`${this.baseUrl}/api/tags`); return r.data.models?.map((m: { name: string }) => m.name) || [this.defaultModel]; } catch { return [this.defaultModel]; }
  }
  async validateConfig(): Promise<boolean> { try { await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 }); return true; } catch { return false; } }
}
