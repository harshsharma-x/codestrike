import { FastifyInstance } from 'fastify';
import { CommandExecutor } from '@codestrike/terminal';

export async function terminalWsRoutes(server: FastifyInstance) {
  const executor = new CommandExecutor();

  server.get('/terminal', { websocket: true }, (socket, req) => {
    const cwd = (req.query as { cwd?: string }).cwd || process.cwd();

    socket.on('message', async (rawData: unknown) => {
      try {
        const { command, id } = JSON.parse(rawData.toString());

        if (!command) return;

        const result = await executor.execute(command, cwd);

        socket.send(JSON.stringify({ type: 'result', id, ...result }));
      } catch (error) {
        socket.send(JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
        }));
      }
    });

    socket.send(JSON.stringify({ type: 'connected', cwd }));
  });
}