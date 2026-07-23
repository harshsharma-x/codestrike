import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: mockPost,
    get: mockGet,
    isAxiosError: (e: any) => e?.isAxiosError === true,
  },
}));

describe('OpenAI Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', async () => {
    const { OpenAIProvider } = await import('./openai');
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    expect(provider.name).toBe('openai');
    expect(provider.displayName).toBe('OpenAI');
    expect(provider.defaultModel).toBe('gpt-4o');
    expect(provider.envKey).toBe('OPENAI_API_KEY');
  });

  it('should validate config with api key', async () => {
    mockGet.mockRejectedValue({ isAxiosError: true, message: 'offline' });

    const { OpenAIProvider } = await import('./openai');
    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const valid = await provider.validateConfig();
    expect(valid).toBe(true);
  });

  it('should return false for validateConfig without key', async () => {
    const { OpenAIProvider } = await import('./openai');
    const provider = new OpenAIProvider();
    const valid = await provider.validateConfig();
    expect(valid).toBe(false);
  });

  it('should build correct request body', async () => {
    const { OpenAIProvider } = await import('./openai');
    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const req = {
      model: 'gpt-4o',
      messages: [{ role: 'user' as const, content: 'Hello' }],
      stream: false,
      temperature: 0.5,
      maxTokens: 1000,
    };
    const body = provider['buildBody'](req);
    expect(body.model).toBe('gpt-4o');
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(1000);
    expect(body.stream).toBe(false);
  });

  it('should throw CodeStrikeError on API error', async () => {
    const error = new Error('Request failed') as any;
    error.isAxiosError = true;
    error.response = { data: { error: { message: 'Rate limit exceeded' } }, status: 429 };
    mockPost.mockRejectedValue(error);

    const { OpenAIProvider } = await import('./openai');
    const { CodeStrikeError } = await import('@codestrike/core');
    const provider = new OpenAIProvider({ apiKey: 'sk-test' });

    try {
      await provider.complete({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      });
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CodeStrikeError);
      expect(e.message).toContain('Rate limit exceeded');
    }
  });

  it('should parse successful completion response', async () => {
    mockPost.mockResolvedValue({
      data: {
        id: 'cmpl-123',
        choices: [{ message: { content: 'Hello!' }, finish_reason: 'stop' }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      },
    });

    const { OpenAIProvider } = await import('./openai');
    const provider = new OpenAIProvider({ apiKey: 'sk-test' });

    const result = await provider.complete({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Hello!');
    expect(result.model).toBe('gpt-4o');
    expect(result.provider).toBe('openai');
    expect(result.tokens.total).toBe(15);
    expect(result.finishReason).toBe('stop');
  });
});
