import { describe, it, expect, vi } from 'vitest';
import { BaseAgent } from './base';
import { AIRouter } from '@codestrike/ai';

class TestAgent extends BaseAgent {
  constructor(router: AIRouter) {
    super('coder', 'TestCoder', router);
  }

  get systemPrompt(): string {
    return 'You are a test agent.';
  }

  get temperature(): number {
    return 0.5;
  }

  get maxTokens(): number {
    return 1000;
  }
}

describe('BaseAgent', () => {
  const router = {
    complete: vi.fn().mockResolvedValue({
      content: 'test result',
      model: 'mixtral-8x7b',
      provider: 'openrouter',
      tokens: { input: 10, output: 20, total: 30 },
      finishReason: 'stop',
    }),
  } as unknown as AIRouter;

  it('should create agent with correct role', () => {
    const agent = new TestAgent(router);
    expect(agent.role).toBe('coder');
    expect(agent.name).toBe('TestCoder');
  });

  it('should execute tasks', async () => {
    const agent = new TestAgent(router);
    const task = {
      id: 'test-1',
      agentId: 'TestCoder',
      type: 'coder' as const,
      prompt: 'write code',
      context: '',
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    const result = await agent.execute(task);
    expect(result.status).toBe('complete');
    expect(result.result).toBe('test result');
  });

  it('should handle task errors', async () => {
    const failingRouter = {
      complete: vi.fn().mockRejectedValue(new Error('API Error')),
    } as unknown as AIRouter;

    const agent = new TestAgent(failingRouter);
    const task = {
      id: 'test-2',
      agentId: 'TestCoder',
      type: 'coder' as const,
      prompt: 'will fail',
      context: '',
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    const result = await agent.execute(task);
    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
  });

  it('should check role compatibility', () => {
    const agent = new TestAgent(router);
    expect(agent.canHandle('coder')).toBe(true);
    expect(agent.canHandle('reviewer')).toBe(false);
  });
});
