import { describe, it, expect, vi } from 'vitest';
import { AgentOrchestrator } from './orchestrator';
import { AIRouter } from '@codestrike/ai';

describe('AgentOrchestrator', () => {
  const router = {
    complete: vi.fn().mockResolvedValue({
      content: 'result',
      model: 'mixtral-8x7b',
      provider: 'openrouter',
      tokens: { input: 10, output: 20, total: 30 },
      finishReason: 'stop',
    }),
  } as unknown as AIRouter;

  it('should create orchestrator with all agents', () => {
    const orchestrator = new AgentOrchestrator(router);
    const agents = orchestrator.getAllAgents();
    expect(agents.length).toBe(10);
  });

  it('should get agent by role', () => {
    const orchestrator = new AgentOrchestrator(router);
    const coder = orchestrator.getAgent('coder');
    expect(coder).toBeDefined();
    expect(coder?.name).toBe('Coder');
  });

  it('should execute single task', async () => {
    const orchestrator = new AgentOrchestrator(router);
    const task = {
      id: 'task-1',
      agentId: 'Planner',
      type: 'planner' as const,
      prompt: 'plan something',
      context: '',
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    const result = await orchestrator.executeTask(task);
    expect(result.status).toBe('complete');
  });

  it('should execute pipeline of tasks', async () => {
    const orchestrator = new AgentOrchestrator(router);
    const tasks = [
      {
        id: 'task-1',
        agentId: 'Planner',
        type: 'planner' as const,
        prompt: 'plan',
        context: '',
        status: 'pending' as const,
        createdAt: Date.now(),
      },
      {
        id: 'task-2',
        agentId: 'Coder',
        type: 'coder' as const,
        prompt: 'code',
        context: '',
        status: 'pending' as const,
        createdAt: Date.now(),
      },
    ];

    const results = await orchestrator.executePipeline(tasks);
    expect(results).toHaveLength(2);
    results.forEach(r => expect(r.status).toBe('complete'));
  });
});
