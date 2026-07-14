import { describe, it, expect } from 'vitest';
import { ProviderRegistry } from './registry';

describe('ProviderRegistry', () => {
  it('should be a singleton', () => {
    const instance1 = ProviderRegistry.getInstance();
    const instance2 = ProviderRegistry.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register all default providers', () => {
    const registry = ProviderRegistry.getInstance();
    const providers = registry.getAvailableProviders();
    expect(providers).toContain('openrouter');
    expect(providers).toContain('groq');
    expect(providers).toContain('huggingface');
    expect(providers).toContain('ollama');
    expect(providers).toContain('lmstudio');
  });

  it('should return a provider by name', () => {
    const registry = ProviderRegistry.getInstance();
    const provider = registry.get('openrouter');
    expect(provider.name).toBe('openrouter');
    expect(provider.displayName).toBe('OpenRouter');
  });

  it('should throw for unknown providers', () => {
    const registry = ProviderRegistry.getInstance();
    expect(() => registry.get('unknown' as any)).toThrow();
  });

  it('should create new instances with config', () => {
    const registry = ProviderRegistry.getInstance();
    const provider = registry.get('groq', { apiKey: 'test-key' });
    expect(provider.name).toBe('groq');
  });
});
