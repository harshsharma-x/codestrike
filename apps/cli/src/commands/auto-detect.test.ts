import { describe, it, expect, vi } from 'vitest';

describe('Auto-Detect Command', () => {
  it('should export a autoDetectCommand with correct name', async () => {
    const { autoDetectCommand } = await import('./auto-detect');
    expect(autoDetectCommand.name()).toBe('auto-detect');
    expect(autoDetectCommand.description()).toBe(
      'Auto-detect and configure the best available AI provider',
    );
  });

  it('should accept --set-default flag', async () => {
    const { autoDetectCommand } = await import('./auto-detect');
    const opts = autoDetectCommand.options;
    const setDefault = opts.find((o) => o.long === '--set-default');
    expect(setDefault).toBeDefined();
  });

  it('should have a runnable action', async () => {
    const { autoDetectCommand } = await import('./auto-detect');
    expect(typeof autoDetectCommand.action).toBe('function');
  });
});
