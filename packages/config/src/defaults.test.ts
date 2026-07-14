import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, getDefaultModelForProvider } from './defaults';

describe('DEFAULT_CONFIG', () => {
  it('should have provider set to openrouter', () => {
    expect(DEFAULT_CONFIG.provider).toBe('openrouter');
  });

  it('should have default model', () => {
    expect(DEFAULT_CONFIG.model).toBe('mistralai/mixtral-8x7b-instruct');
  });

  it('should have reasonable defaults', () => {
    expect(DEFAULT_CONFIG.temperature).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_CONFIG.temperature).toBeLessThanOrEqual(2);
    expect(DEFAULT_CONFIG.maxTokens).toBeGreaterThan(0);
  });
});

describe('getDefaultModelForProvider', () => {
  it('should return correct model for each provider', () => {
    expect(getDefaultModelForProvider('openrouter')).toBe('mistralai/mixtral-8x7b-instruct');
    expect(getDefaultModelForProvider('groq')).toBe('mixtral-8x7b-32768');
    expect(getDefaultModelForProvider('ollama')).toBe('codellama');
    expect(getDefaultModelForProvider('lmstudio')).toBe('local-model');
  });

  it('should default to openrouter for unknown providers', () => {
    expect(getDefaultModelForProvider('unknown' as any)).toBe('mistralai/mixtral-8x7b-instruct');
  });
});
