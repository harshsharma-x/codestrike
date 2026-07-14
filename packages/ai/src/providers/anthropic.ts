import axios from 'axios';
import { BaseAIProvider } from './interface';
import { AICompletionRequest, AICompletionResponse, AIStreamChunk } from '../types';
import { CodeStrikeError } from '@codestrike/core';

const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';
const ENV_KEY = 'ANTHROPIC_API_KEY';

export class AnthropicProvider extends BaseAIProvider {
  readonly name = 'anthropic';
  readonly displayName = 'Anthropic';
  readonly defaultModel = 'claude-sonnet-4-20250514';
  readonly envKey = ENV_KEY;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super({ apiKey: config?.apiKey || process.env[ENV_KEY] || '', baseUrl: config?.baseUrl || DEFAULT_BASE_URL });
  }

  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const sysMsg = req.messages.find(m => m.role === 'system')?.content || '';
      const body: Record<string, unknown> = {
        model: req.model || this.defaultModel,
        max_tokens: req.maxTokens || 4096,
        messages: req.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        temperature: req.temperature ?? 0.7,
      };
      if (sysMsg) body.system = sysMsg;
      const r = await axios.post(`${this.baseUrl}/messages`, body, { headers: this.buildHeaders(), timeout: 60000 });
      const d = r.data;
      return { id: d.id, content: d.content[0]?.text || '', model: d.model, provider: 'anthropic', tokens: { input: d.usage?.input_tokens || 0, output: d.usage?.output_tokens || 0, total: (d.usage?.input_tokens || 0) + (d.usage?.output_tokens || 0) }, finishReason: d.stop_reason || 'stop' };
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`Anthropic error: ${error.response?.data?.error?.message || error.message}`, 'AI_PROVIDER_ERROR', error.response?.status || 500);
      throw error;
    }
  }

  async *stream(req: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    try {
      const sysMsg = req.messages.find(m => m.role === 'system')?.content || '';
      const body: Record<string, unknown> = {
        model: req.model || this.defaultModel,
        max_tokens: req.maxTokens || 4096,
        messages: req.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        stream: true,
        temperature: req.temperature ?? 0.7,
      };
      if (sysMsg) body.system = sysMsg;
      
      const r = await axios.post(`${this.baseUrl}/messages`, body, { headers: this.buildHeaders(), responseType: 'stream', timeout: 120000 });
      let buf = '';
      for await (const c of r.data) {
        buf += c.toString();
        for (const l of buf.split('\n').slice(0, -1)) {
          const t = l.trim();
          if (t.startsWith('event: ')) continue;
          if (t.startsWith('data: ')) {
            try {
              const j = JSON.parse(t.slice(6));
              if (j.type === 'content_block_delta' && j.delta?.text) yield { content: j.delta.text, done: false };
              if (j.type === 'message_stop') yield { content: '', done: true };
            } catch { /* */ }
          }
        }
        buf = buf.split('\n').pop() || '';
      }
    } catch (error) {
      if (axios.isAxiosError(error)) throw new CodeStrikeError(`Anthropic stream error: ${error.message}`, 'AI_PROVIDER_ERROR', error.response?.status || 500);
      throw error;
    }
  }
}
