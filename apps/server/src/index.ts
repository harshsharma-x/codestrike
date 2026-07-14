import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { chatRoutes } from './routes/chat';
import { agentRoutes } from './routes/agents';
import { projectRoutes } from './routes/projects';
import { gitRoutes } from './routes/git';
import { terminalRoutes } from './routes/terminal';
import { configRoutes } from './routes/config';
import { mcpRoutes } from './routes/mcp';
import { terminalWsRoutes } from './routes/terminal-ws';
import { Logger } from '@codestrike/core';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const logger = new Logger('Server');

function loadEnvFile(): void {
  const envPath = join(homedir(), '.codestrike', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
  logger.info('Loaded API keys from ~/.codestrike/.env');
}

loadEnvFile();

export async function buildServer() {
  const server = Fastify({
    logger: true,
    bodyLimit: 10 * 1024 * 1024,
  });

  await server.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await server.register(websocket);

  await server.register(swagger, {
    openapi: {
      info: {
        title: 'CodeStrike AI API',
        version: '0.1.0',
        description: 'API for CodeStrike AI coding assistant',
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
  });

  server.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now(), version: '0.1.0' };
  });

  server.register(chatRoutes, { prefix: '/api/chat' });
  server.register(agentRoutes, { prefix: '/api/agents' });
  server.register(projectRoutes, { prefix: '/api/projects' });
  server.register(gitRoutes, { prefix: '/api/git' });
  server.register(terminalRoutes, { prefix: '/api/terminal' });
  server.register(configRoutes, { prefix: '/api/config' });
  server.register(mcpRoutes, { prefix: '/api/mcp' });
  server.register(terminalWsRoutes, { prefix: '/ws' });

  return server;
}

async function start() {
  try {
    const server = await buildServer();

    try {
      const { connectDatabase } = await import('@codestrike/database');
      await connectDatabase();
      logger.info('Database connected');
    } catch (dbError) {
      logger.warn('Database not available, running without persistence', { error: String(dbError) });
    }

    const port = parseInt(process.env.PORT || '4000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`Server running on port ${port}`);
    logger.info(`API docs at http://localhost:${port}/docs`);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
