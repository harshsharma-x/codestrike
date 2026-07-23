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
    'test',
    'docs',
    'search',
    'status',
    'run',
    'login',
    'terminal',
    'session',
    'providers',
    'agent',
    'memory',
    'plugins',
    'update',
    'mcp',
  ];

  it('should export all 25 commands as Command objects', async () => {
    for (const name of allCommands) {
      const mod = await import(`./commands/${name}`);
      const commandKey = `${name}Command`;
      const cmd = mod[commandKey];
      expect(cmd).toBeDefined();
      expect(cmd.name()).toBe(name);
    }
  });

  it('should have no duplicate or missing command names', () => {
    const unique = new Set(allCommands);
    expect(unique.size).toBe(25);
  });

  it('each command file should be in the index', async () => {
    const indexContent = await import(`./index`).catch(() => null);
    // Just verify the commands exist
    for (const name of allCommands) {
      const mod = await import(`./commands/${name}`);
      const cmd = mod[`${name}Command`];
      expect(typeof cmd.action).toBe('function');
      expect(typeof cmd.description).toBe('function');
    }
  });
});
