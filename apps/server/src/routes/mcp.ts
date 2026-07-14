import { FastifyInstance } from 'fastify';
import { MCPRegistry, MCPClient } from '@codestrike/mcp';
import { MCPServerConfigSchema } from '@codestrike/core';

export async function mcpRoutes(server: FastifyInstance) {
  server.get('/', async () => {
    const registry = MCPRegistry.getInstance();
    const clients = registry.getClients();
    const servers = await Promise.all(clients.map(async (c: MCPClient) => {
      try {
        const tools = await c.listTools();
        return { name: c.name, status: c.status, tools: tools.length };
      } catch {
        return { name: c.name, status: c.status, tools: 0 };
      }
    }));
    return { servers };
  });

  server.post('/connect', async (request, reply) => {
    const config = request.body as any;
    const parsed = MCPServerConfigSchema.parse(config);

    const registry = MCPRegistry.getInstance();
    await registry.initialize([parsed]);

    return { success: true, name: parsed.name };
  });

  server.post('/:name/disconnect', async (request, reply) => {
    const { name } = request.params as { name: string };
    const registry = MCPRegistry.getInstance();
    const client = registry.getClient(name);
    if (!client) return reply.status(404).send({ error: 'Server not found' });

    await client.disconnect();
    return { success: true };
  });

  server.get('/:name/tools', async (request, reply) => {
    const { name } = request.params as { name: string };
    const registry = MCPRegistry.getInstance();
    const client = registry.getClient(name);
    if (!client) return reply.status(404).send({ error: 'Server not found' });

    try {
      const tools = await client.listTools();
      return { tools };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to list tools', message: String(error) });
    }
  });

  server.post('/:name/call', async (request, reply) => {
    const { name } = request.params as { name: string };
    const { tool, args } = request.body as { tool: string; args: Record<string, unknown> };
    const registry = MCPRegistry.getInstance();
    const client = registry.getClient(name);
    if (!client) return reply.status(404).send({ error: 'Server not found' });

    try {
      const result = await client.callTool(tool, args);
      return result;
    } catch (error) {
      return reply.status(500).send({ error: 'Tool call failed', message: String(error) });
    }
  });
}
