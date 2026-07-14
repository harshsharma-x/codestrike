import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn().mockReturnValue('{}'),
  writeFileSync: vi.fn(),
}));

import { ConfigLoader } from './loader';

describe('ConfigLoader', () => {
  let loader: ConfigLoader;

  beforeEach(() => {
    loader = new ConfigLoader('/test');
  });

  it('should load default config when no file exists', () => {
    const config = loader.load();
    expect(config.provider).toBe('openrouter');
    expect(config.model).toBe('mistralai/mixtral-8x7b-instruct');
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(4096);
  });

  it('should report when config file does not exist', () => {
    expect(loader.exists()).toBe(false);
  });

  it('should get default values', () => {
    expect(loader.get('provider')).toBe('openrouter');
    expect(loader.get('temperature')).toBe(0.7);
  });
});
