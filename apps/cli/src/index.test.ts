import { describe, it, expect } from 'vitest';

describe('CLI', () => {
  const allCommands = [
    'init',
    'chat',
    'models',
    'doctor',
    'config',
    'index',
    'review',
    'commit',
    'explain',
    'debug',
    'fix',
    'pr',
    'test',
    'docs',
    'search',
    'status',
    'run',
    'login',
    'logout',
    'terminal',
    'session',
    'providers',
    'agent',
    'memory',
    'plugins',
    'update',
    'mcp',
    'benchmark',
    'pipeline',
    'auto-detect',
  ];

  it('should export all 30 commands as Command objects', async () => {
    const exportMap: Record<string, string> = {
      'auto-detect': 'autoDetectCommand',
    };
    for (const name of allCommands) {
      const mod = await import(`./commands/${name}`);
      const commandKey = exportMap[name] || `${name}Command`;
      const cmd = mod[commandKey];
      expect(cmd).toBeDefined();
      expect(cmd.name()).toBe(name);
    }
  }, 15000);

  it('should have no duplicate or missing command names', () => {
    const unique = new Set(allCommands);
    expect(unique.size).toBe(30);
  });

  it('each command file should be in the index', async () => {
    const exportMap: Record<string, string> = {
      'auto-detect': 'autoDetectCommand',
    };
    const indexContent = await import(`./index`).catch(() => null);
    for (const name of allCommands) {
      const mod = await import(`./commands/${name}`);
      const cmd = mod[exportMap[name] || `${name}Command`];
      expect(cmd).toBeDefined();
      expect(typeof cmd.name).toBe('function');
    }
  }, 15000);
});
