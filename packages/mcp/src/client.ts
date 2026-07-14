import { MCPTransport, createTransport } from './transport';
import {
  MCPServerConfig,
  MCPToolDefinition,
  MCPResourceDefinition,
  MCPPromptDefinition,
  MCPCallToolResult,
  MCPReadResourceResult,
  MCPGetPromptResult,
  MCPProviderStatus,
} from './types';

export class MCPClient {
  private transport: MCPTransport;
  private config: MCPServerConfig;
  private serverCapabilities: Record<string, unknown> = {};
  private serverInfo: Record<string, unknown> = {};
  private _status: MCPProviderStatus = 'disconnected';

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.transport = createTransport(config);
  }

  get name(): string {
    return this.config.name;
  }

  get status(): MCPProviderStatus {
    return this._status;
  }

  get configData(): MCPServerConfig {
    return this.config;
  }

  async initialize(): Promise<void> {
    this._status = 'connecting';
    try {
      await this.transport.connect();

      const response = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, resources: {}, prompts: {} },
        clientInfo: { name: 'codestrike', version: '0.1.0' },
      });

      this.serverCapabilities = (response.result?.capabilities as Record<string, unknown>) || {};
      this.serverInfo = (response.result?.serverInfo as Record<string, unknown>) || {};

      await this.sendRequest('notifications/initialized', {});
      this._status = 'connected';
    } catch (error) {
      this._status = 'error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this._status = 'disconnected';
  }

  async listTools(): Promise<MCPToolDefinition[]> {
    const response = await this.sendRequest('tools/list', {});
    const tools = (response.result?.tools as any[]) || [];
    return tools.map(t => ({ ...t, serverName: this.config.name }));
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<MCPCallToolResult> {
    const response = await this.sendRequest('tools/call', { name, arguments: args });
    return response.result as MCPCallToolResult;
  }

  async listResources(): Promise<MCPResourceDefinition[]> {
    const response = await this.sendRequest('resources/list', {});
    const resources = (response.result?.resources as any[]) || [];
    return resources.map(r => ({ ...r, serverName: this.config.name }));
  }

  async readResource(uri: string): Promise<MCPReadResourceResult> {
    const response = await this.sendRequest('resources/read', { uri });
    return response.result as MCPReadResourceResult;
  }

  async listPrompts(): Promise<MCPPromptDefinition[]> {
    const response = await this.sendRequest('prompts/list', {});
    const prompts = (response.result?.prompts as any[]) || [];
    return prompts.map(p => ({ ...p, serverName: this.config.name }));
  }

  async getPrompt(name: string, args: Record<string, string> = {}): Promise<MCPGetPromptResult> {
    const response = await this.sendRequest('prompts/get', { name, arguments: args });
    return response.result as MCPGetPromptResult;
  }

  private async sendRequest(method: string, params: Record<string, unknown> = {}): Promise<any> {
    return this.transport.send({
      jsonrpc: '2.0',
      id: `${this.config.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      method,
      params,
    });
  }
}
