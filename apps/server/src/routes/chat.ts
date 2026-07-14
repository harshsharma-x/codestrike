import { FastifyInstance } from 'fastify';
import { createRouter } from '@codestrike/ai';

export async function chatRoutes(server: FastifyInstance) {
  server.post('/completions', async (request, reply) => {
    const { messages, model, provider, stream } = request.body as {
      messages: { role: string; content: string }[];
      model?: string;
      provider?: string;
      stream?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return reply.status(400).send({ error: 'Messages array is required' });
    }

    const router = createRouter({
      primaryProvider: (provider as any) || 'openrouter',
    });

    if (stream) {
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      try {
        const streamGen = router.stream({
          messages: messages.map(m => ({
            role: m.role as 'system' | 'user' | 'assistant',
            content: m.content,
          })),
          model: model || 'mistralai/mixtral-8x7b-instruct',
          provider: (provider as any) || 'openrouter',
          stream: true,
        });

        for await (const chunk of streamGen) {
          if (chunk.content) {
            reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          if (chunk.done) {
            reply.raw.write('data: [DONE]\n\n');
          }
        }
      } catch (error) {
        reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
      } finally {
        reply.raw.end();
      }
    } else {
      try {
        const response = await router.complete({
          messages: messages.map(m => ({
            role: m.role as 'system' | 'user' | 'assistant',
            content: m.content,
          })),
          model: model || 'mistralai/mixtral-8x7b-instruct',
          provider: (provider as any) || 'openrouter',
          stream: false,
        });

        return response;
      } catch (error) {
        return reply.status(502).send({
          error: 'AI provider error',
          message: String(error),
        });
      }
    }
  });

  server.get('/models', async () => {
    const { ProviderRegistry } = await import('@codestrike/ai');
    const registry = ProviderRegistry.getInstance();

    return {
      providers: registry.getAvailableProviders().map(name => ({
        name,
        displayName: registry.get(name).displayName,
        defaultModel: registry.get(name).defaultModel,
      })),
    };
  });
}
