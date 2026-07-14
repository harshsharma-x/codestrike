import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from './registry';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('should register and retrieve a plugin', () => {
    registry.register({
      manifest: { name: 'test-plugin', version: '1.0.0', entry: './plugin.js' },
      hooks: {},
    });
    const plugin = registry.get('test-plugin');
    expect(plugin).not.toBeUndefined();
    expect(plugin!.manifest.name).toBe('test-plugin');
  });

  it('should return all plugins', () => {
    registry.register({
      manifest: { name: 'a', version: '1.0.0', entry: './a.js' },
      hooks: {},
    });
    registry.register({
      manifest: { name: 'b', version: '1.0.0', entry: './b.js' },
      hooks: {},
    });
    expect(registry.getAll().length).toBe(2);
  });

  it('should unregister a plugin', () => {
    registry.register({
      manifest: { name: 'temp', version: '1.0.0', entry: './temp.js' },
      hooks: {},
    });
    registry.unregister('temp');
    expect(registry.get('temp')).toBeUndefined();
  });

  it('should return enabled plugins only', () => {
    registry.register({
      manifest: { name: 'enabled-a', version: '1.0.0', entry: './a.js' },
      hooks: {},
    });
    registry.register({
      manifest: { name: 'disabled-b', version: '1.0.0', entry: './b.js' },
      hooks: {},
    });
    registry.setConfig('disabled-b', { enabled: false });
    const enabled = registry.getEnabled();
    expect(enabled.length).toBe(1);
    expect(enabled[0].manifest.name).toBe('enabled-a');
  });

  it('should manage plugin config', () => {
    registry.register({
      manifest: { name: 'cfg', version: '1.0.0', entry: './cfg.js' },
      hooks: {},
    });
    registry.setConfig('cfg', { config: { key: 'value' } });
    const cfg = registry.getConfig('cfg');
    expect(cfg.config).toEqual({ key: 'value' });
  });
});
