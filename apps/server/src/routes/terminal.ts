import { FastifyInstance } from 'fastify';
import { CommandExecutor } from '@codestrike/terminal';

export async function terminalRoutes(server: FastifyInstance) {
  const executor = new CommandExecutor();

  server.post('/execute', async (request, reply) => {
    const { command, cwd } = request.body as {
      command: string;
      cwd?: string;
    };

    if (!command) {
      return reply.status(400).send({ error: 'Command is required' });
    }

    try {
      const result = await executor.execute(command, cwd || process.cwd());
      return result;
    } catch (error) {
      return reply.status(500).send({
        error: 'Command execution failed',
        message: String(error),
      });
    }
  });

  server.post('/cancel', async (request) => {
    const { id } = request.body as { id?: string };
    if (id) {
      executor.cancel(id);
    } else {
      executor.cancelAll();
    }
    return { success: true };
  });
}
