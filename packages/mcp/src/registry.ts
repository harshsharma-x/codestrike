import { MCPServerConfig, MCPToolDefinition } from './types';
import { MCPClient } from './client';
import { Logger } from '@codestrike/core';

const logger = new Logger('MCPRegistry');

export class MCPRegistry {
  private static instance: MCPRegistry;
  private clients: Map<string, MCPClient> = new Map();
  private initialized = false;

  static getInstance(): MCPRegistry {
    if (!MCPRegistry.instance) {
      MCPRegistry.instance = new MCPRegistry();
    }
    return MCPRegistry.instance;
  }

  async initialize(configs: MCPServerConfig[]): Promise<void> {
    if (this.initialized) return;

    const enabled = configs.filter(c => c.enabled !== false);

    for (const config of enabled) {
      try {
        const client = new MCPClient(config);
        await client.initialize();
        this.clients.set(config.name, client);
        logger.info(`MCP server connected: ${config.name}`);
      } catch (error) {
        logger.error(`Failed to connect MCP server: ${config.name}`, { error: String(error) });
      }
    }

    this.initialized = true;
  }

  async getAllTools(): Promise<MCPToolDefinition[]> {
    const allTools: MCPToolDefinition[] = [];

    for (const [, client] of this.clients) {
      try {
        const tools = await client.listTools();
        allTools.push(...tools);
      } catch (error) {
        logger.error(`Failed to list tools from ${client.name}`, { error: String(error) });
      }
    }

    return allTools;
  }

  async callTool(serverName: string, toolName: string, args: Record<string, unknown> = {}): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }
    return client.callTool(toolName, args);
  }

  getClient(name: string): MCPClient | undefined {
    return this.clients.get(name);
  }

  getClients(): MCPClient[] {
    return Array.from(this.clients.values());
  }

  getStatus(name: string): string {
    return this.clients.get(name)?.status || 'disconnected';
  }

  getAllStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [name, client] of this.clients) {
      status[name] = client.status;
    }
    return status;
  }

  async disconnectAll(): Promise<void> {
    for (const [, client] of this.clients) {
      try {
        await client.disconnect();
      } catch { /* ignore */ }
    }
    this.clients.clear();
    this.initialized = false;
  }
}
