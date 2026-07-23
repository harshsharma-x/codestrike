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

describe('Ollama Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', async () => {
    const { OllamaProvider } = await import('./ollama');
    const provider = new OllamaProvider();
    expect(provider.name).toBe('ollama');
    expect(provider.displayName).toBe('Ollama');
    expect(provider.defaultModel).toBe('codellama');
    expect(provider.envKey).toBe('OLLAMA_HOST');
  });

  it('should validate config as false when offline', async () => {
    mockGet.mockRejectedValue({
      isAxiosError: true,
      message: 'ECONNREFUSED',
      code: 'ECONNREFUSED',
    });

    const { OllamaProvider } = await import('./ollama');
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434' });
    const valid = await provider.validateConfig();
    expect(valid).toBe(false);
  });

  it('should parse successful completion', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: { content: 'Hello from Ollama!' },
        model: 'codellama',
        done: true,
      },
    });

    const { OllamaProvider } = await import('./ollama');
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434' });

    const result = await provider.complete({
      model: 'codellama',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Hello from Ollama!');
    expect(result.provider).toBe('ollama');
    expect(result.finishReason).toBe('stop');
  });

  it('should throw offline error when connection refused', async () => {
    const error = new Error('connect ECONNREFUSED') as any;
    error.isAxiosError = true;
    error.code = 'ECONNREFUSED';
    mockPost.mockRejectedValue(error);

    const { OllamaProvider } = await import('./ollama');
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434' });

    await expect(
      provider.complete({
        model: 'codellama',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    ).rejects.toThrow('Ollama not running');
  });
});
