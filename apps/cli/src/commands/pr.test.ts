import { describe, it, expect, vi } from 'vitest';

describe('PR Command', () => {
  it('should export a prCommand with correct name', async () => {
    const { prCommand } = await import('./pr');
    expect(prCommand.name()).toBe('pr');
    expect(prCommand.description()).toBe('Create a GitHub Pull Request');
  });

  it('should accept --title flag', async () => {
    const { prCommand } = await import('./pr');
    const opts = prCommand.options;
    expect(opts.find((o) => o.long === '--title')).toBeDefined();
  });

  it('should accept --description flag', async () => {
    const { prCommand } = await import('./pr');
    const opts = prCommand.options;
    expect(opts.find((o) => o.long === '--description')).toBeDefined();
  });

  it('should accept --yes flag', async () => {
    const { prCommand } = await import('./pr');
    const opts = prCommand.options;
    expect(opts.find((o) => o.long === '--yes')).toBeDefined();
  });
});
