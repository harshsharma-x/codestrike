import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from './index';

describe('ConfigManager', () => {
  let config: ConfigManager;

  beforeEach(() => {
    config = ConfigManager.getInstance();
    config.clear();
  });

  it('should be a singleton', () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should set and get values', () => {
    config.set('key', 'value');
    expect(config.get('key')).toBe('value');
  });

  it('should return undefined for missing keys', () => {
    expect(config.get('nonexistent')).toBeUndefined();
  });

  it('should check if key exists', () => {
    config.set('exists', true);
    expect(config.has('exists')).toBe(true);
    expect(config.has('missing')).toBe(false);
  });

  it('should delete keys', () => {
    config.set('temp', 'value');
    config.delete('temp');
    expect(config.has('temp')).toBe(false);
  });

  it('should get all entries', () => {
    config.set('a', 1);
    config.set('b', 2);
    expect(config.getAll()).toEqual({ a: 1, b: 2 });
  });

  it('should clear all entries', () => {
    config.set('a', 1);
    config.clear();
    expect(config.getAll()).toEqual({});
  });
});
