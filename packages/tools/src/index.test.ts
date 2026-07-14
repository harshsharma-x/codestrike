import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from './registry';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should have default tools registered', () => {
    const all = registry.getAll();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].name).toBeDefined();
  });

  it('should get tools by category', () => {
    const fileTools = registry.getByCategory('file');
    expect(fileTools.length).toBeGreaterThan(0);
    fileTools.forEach(t => expect(t.category).toBe('file'));
  });

  it('should return error for unknown tool', async () => {
    const result = await registry.execute('nonexistent', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown tool');
  });
});
