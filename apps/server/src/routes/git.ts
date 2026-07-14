import { FastifyInstance } from 'fastify';
import { GitService } from '@codestrike/git';

export async function gitRoutes(server: FastifyInstance) {
  server.get('/status', async () => {
    const git = new GitService();
    const isRepo = await git.isRepo();

    if (!isRepo) {
      return { isRepo: false };
    }

    const status = await git.getStatus();
    return {
      isRepo: true,
      ...status,
    };
  });

  server.post('/commit', async (request, reply) => {
    const { message, files } = request.body as {
      message: string;
      files?: string[];
    };

    if (!message) {
      return reply.status(400).send({ error: 'Commit message is required' });
    }

    const git = new GitService();

    try {
      if (files && files.length > 0) {
        await git.add(files);
      } else {
        await git.add([]);
      }

      const result = await git.commit(message);
      return { success: true, message: result };
    } catch (error) {
      return reply.status(500).send({
        error: 'Commit failed',
        message: String(error),
      });
    }
  });

  server.get('/diff', async (request) => {
    const { ref1, ref2 } = request.query as { ref1?: string; ref2?: string };
    const git = new GitService();

    try {
      const diff = await git.diff();
      return { diff };
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to get diff',
        message: String(error),
      });
    }
  });

  server.get('/log', async (request) => {
    const { count } = request.query as { count?: string };
    const git = new GitService();

    try {
      const log = await git.log(parseInt(count || '10'));
      return { log };
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to get log',
        message: String(error),
      });
    }
  });
}
