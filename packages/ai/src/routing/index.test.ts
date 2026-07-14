import { describe, it, expect, vi } from 'vitest';
import { createRouter, AIRouter } from './index';

vi.mock('../providers/registry', () => ({
  ProviderRegistry: {
    getInstance: () => ({
      get: (name: string) => {
        if (name === 'openrouter') {
          return {
            name: 'openrouter',
            defaultModel: 'mixtral-8x7b',
            complete: vi.fn().mockResolvedValue({
              id: 'test-id',
              content: 'test response',
              model: 'mixtral-8x7b',
              provider: 'openrouter',
              tokens: { input: 10, output: 20, total: 30 },
              finishReason: 'stop',
            }),
            stream: vi.fn(),
          };
        }
        throw new Error(`Unknown provider: ${name}`);
      },
      getAvailableProviders: () => ['openrouter', 'groq'],
    }),
  },
}));

describe('AIRouter', () => {
  it('should create router with defaults', () => {
    const router = createRouter();
    expect(router).toBeInstanceOf(AIRouter);
  });

  it('should complete requests', async () => {
    const router = createRouter();
    const response = await router.complete({
      messages: [{ role: 'user', content: 'hello' }],
      model: 'mixtral-8x7b',
      provider: 'openrouter',
      stream: false,
    });

    expect(response.content).toBe('test response');
    expect(response.model).toBe('mixtral-8x7b');
    expect(response.provider).toBe('openrouter');
  });

  it('should handle provider failover', async () => {
    const router = new AIRouter({
      primaryProvider: 'openrouter',
      fallbackProviders: ['groq'],
      maxRetries: 0,
    });

    const response = await router.complete({
      messages: [{ role: 'user', content: 'hello' }],
      model: 'mixtral-8x7b',
      provider: 'openrouter',
      stream: false,
    });

    expect(response).toBeDefined();
  });
});
