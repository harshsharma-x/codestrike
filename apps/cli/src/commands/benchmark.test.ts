import { describe, it, expect, vi } from 'vitest';

describe('Benchmark Command', () => {
  it('should export a benchmarkCommand with correct name', async () => {
    const { benchmarkCommand } = await import('./benchmark');
    expect(benchmarkCommand.name()).toBe('benchmark');
    expect(benchmarkCommand.description()).toBe('Benchmark all available AI providers');
  });

  it('should accept --quick flag', async () => {
    const { benchmarkCommand } = await import('./benchmark');
    const opts = benchmarkCommand.options;
    expect(opts.find((o) => o.long === '--quick')).toBeDefined();
  });

  it('should accept --provider flag', async () => {
    const { benchmarkCommand } = await import('./benchmark');
    const opts = benchmarkCommand.options;
    expect(opts.find((o) => o.long === '--provider')).toBeDefined();
  });
});
