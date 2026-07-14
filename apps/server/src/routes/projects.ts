import { FastifyInstance } from 'fastify';
import { ProjectIndexer } from '@codestrike/rag';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function projectRoutes(server: FastifyInstance) {
  const indexer = new ProjectIndexer();

  server.post('/index', async (request, reply) => {
    const { rootDir } = request.body as { rootDir?: string };
    const dir = rootDir || process.cwd();

    if (!existsSync(dir)) {
      return reply.status(400).send({ error: 'Directory not found' });
    }

    try {
      const entries = await indexer.indexProject(dir);
      return {
        files: entries.length,
        languages: [...new Set(entries.map(e => e.language))],
        entries: entries.map(e => ({
          path: e.path,
          language: e.language,
          tokens: e.tokens,
          exports: e.exports,
        })),
      };
    } catch (error) {
      return reply.status(500).send({
        error: 'Indexing failed',
        message: String(error),
      });
    }
  });

  server.get('/search', async (request, reply) => {
    const { query } = request.query as { query?: string };
    if (!query) {
      return reply.status(400).send({ error: 'query parameter is required' });
    }

    const entries = indexer.getAllEntries();
    const { semanticSearch } = await import('@codestrike/rag');
    const results = semanticSearch(query, entries, 10);

    return results.map(r => ({
      path: r.entry.path,
      language: r.entry.language,
      score: r.score,
      matches: r.matches.slice(0, 3),
      summary: r.entry.summary,
    }));
  });

  server.get('/status', async () => {
    return indexer.status;
  });

  server.get('/structure', async () => {
    return { tree: indexer.getProjectStructure() };
  });
}
