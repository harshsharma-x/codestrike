import { describe, it, expect, vi } from 'vitest';

describe('Logout Command', () => {
  it('should export a logoutCommand with correct name', async () => {
    const { logoutCommand } = await import('./logout');
    expect(logoutCommand.name()).toBe('logout');
    expect(logoutCommand.description()).toBe('Remove stored API keys');
  });

  it('should accept --all flag', async () => {
    const { logoutCommand } = await import('./logout');
    const opts = logoutCommand.options;
    expect(opts.find((o) => o.long === '--all')).toBeDefined();
  });

  it('should accept --provider flag', async () => {
    const { logoutCommand } = await import('./logout');
    const opts = logoutCommand.options;
    expect(opts.find((o) => o.long === '--provider')).toBeDefined();
  });
});
