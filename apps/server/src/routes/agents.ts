import { FastifyInstance } from 'fastify';
import { createRouter } from '@codestrike/ai';
import { AgentOrchestrator } from '@codestrike/agents';
import { AgentRole } from '@codestrike/shared';

export async function agentRoutes(server: FastifyInstance) {
  const router = createRouter();
  const orchestrator = new AgentOrchestrator(router);

  server.post('/execute', async (request, reply) => {
    const { type, prompt, context } = request.body as {
      type: AgentRole;
      prompt: string;
      context?: string;
    };

    if (!type || !prompt) {
      return reply.status(400).send({ error: 'type and prompt are required' });
    }

    const task = {
      id: `task-${Date.now()}`,
      agentId: type,
      type,
      prompt,
      context: context || '',
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    try {
      const result = await orchestrator.executeTask(task);
      return result;
    } catch (error) {
      return reply.status(500).send({
        error: 'Agent execution failed',
        message: String(error),
      });
    }
  });

  server.post('/execute-pipeline', async (request, reply) => {
    const { tasks } = request.body as {
      tasks: { type: AgentRole; prompt: string; context?: string }[];
    };

    if (!tasks || !Array.isArray(tasks)) {
      return reply.status(400).send({ error: 'tasks array is required' });
    }

    const agentTasks = tasks.map((t, i) => ({
      id: `task-${Date.now()}-${i}`,
      agentId: t.type,
      type: t.type,
      prompt: t.prompt,
      context: t.context || '',
      status: 'pending' as const,
      createdAt: Date.now(),
    }));

    const results = await orchestrator.executePipeline(agentTasks);
    return { results };
  });

  server.get('/', async () => {
    return {
      agents: orchestrator.getAllAgents().map(a => ({
        name: a.name,
        role: a.role,
      })),
    };
  });
}
