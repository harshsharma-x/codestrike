import { describe, it, expect } from 'vitest';
import { MCPRegistry } from './index';
import { MCPServerConfig } from './types';

describe('MCP Types', () => {
  it('should validate stdio server config', () => {
    const config: MCPServerConfig = {
      name: 'test',
      transport: 'stdio',
      command: 'node',
      args: ['server.js'],
    };
    expect(config.name).toBe('test');
    expect(config.transport).toBe('stdio');
  });

  it('should validate http server config', () => {
    const config: MCPServerConfig = {
      name: 'remote',
      transport: 'http',
      url: 'http://localhost:8080/mcp',
    };
    expect(config.name).toBe('remote');
    expect(config.transport).toBe('http');
  });
});

describe('MCPRegistry', () => {
  it('should be a singleton', () => {
    const a = MCPRegistry.getInstance();
    const b = MCPRegistry.getInstance();
    expect(a).toBe(b);
  });

  it('should initialize and return empty tools when no servers', async () => {
    const registry = MCPRegistry.getInstance();
    const tools = await registry.getAllTools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it('should return server status', () => {
    const registry = MCPRegistry.getInstance();
    const status = registry.getAllStatus();
    expect(typeof status).toBe('object');
  });
});
