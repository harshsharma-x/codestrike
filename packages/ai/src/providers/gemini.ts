import axios from 'axios';
import { BaseAIProvider } from './interface';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from '../types';
import { CodeStrikeError } from '@codestrike/core';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const ENV_KEY = 'GEMINI_API_KEY';

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  readonly displayName = 'Gemini';
  readonly defaultModel = 'gemini-2.5-flash';
  readonly envKey = ENV_KEY;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super({ apiKey: config?.apiKey || process.env[ENV_KEY] || '', baseUrl: config?.baseUrl || DEFAULT_BASE_URL });
  }

  private buildGeminiBody(req: AICompletionRequest): Record<string, unknown> {
    const sysMsg = req.messages.find(m => m.role === 'system')?.content;
    const contents = req.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = {
      contents,
      generationConfig: { temperature: req.temperature ?? 0.7, maxOutputTokens: req.maxTokens || 4096 },
    };
    if (sysMsg) body.systemInstruction = { parts: [{ text: sysMsg }] };
    return body;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, this.buildGeminiBody(req), { timeout: 60000 });
      const d = r.data;
      return { id: `gemini-${Date.now()}`, content: d.candidates?.[0]?.content?.parts?.[0]?.text || '', model, provider: 'gemini', tokens: { input: d.usageMetadata?.promptTokenCount || 0, output: d.usageMetadata?.candidatesTokenCount || 0, total: d.usageMetadata?.totalTokenCount || 0 }, finishReason: d.candidates?.[0]?.finishReason || 'stop' };
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`Gemini error: ${error.response?.data?.error?.message || error.message}`, 'AI_PROVIDER_ERROR', error.response?.status || 500);
      throw error;
    }
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const model = req.model || this.defaultModel;
    try {
      const r = await axios.post(`${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`, this.buildGeminiBody(req), { responseType: 'stream', timeout: 120000 });
      let buf = '';
      for await (const c of r.data) {
        buf += c.toString();
        for (const l of buf.split('\n').slice(0, -1)) {
          const t = l.trim();
          if (!t || !t.startsWith('data: ')) continue;
          try {
            const j = JSON.parse(t.slice(6));
            const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield { content: text, done: false };
            if (j.candidates?.[0]?.finishReason) yield { content: '', done: true, model };
          } catch { /* */ }
        }
        buf = buf.split('\n').pop() || '';
      }
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`Gemini stream error: ${error.message}`, 'AI_PROVIDER_ERROR', error.response?.status || 500);
      throw error;
    }
  }
}
