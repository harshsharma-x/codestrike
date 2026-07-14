import { describe, it, expect } from 'vitest';
import { generateId, truncate, slugify, detectLanguage, formatBytes, formatDuration } from './utils';

describe('generateId', () => {
  it('should generate 24-character IDs', () => {
    expect(generateId()).toHaveLength(24);
  });

  it('should only contain valid characters', () => {
    expect(generateId()).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('truncate', () => {
  it('should return short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long strings with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('should handle empty strings', () => {
    expect(truncate('', 5)).toBe('');
  });
});

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('my feature')).toBe('my-feature');
  });

  it('should replace special characters with hyphens', () => {
    expect(slugify('hello!@#$%^&*()world')).toBe('hello-world');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(slugify('!hello world!')).toBe('hello-world');
  });
});

describe('detectLanguage', () => {
  it('should detect TypeScript', () => {
    expect(detectLanguage('file.ts')).toBe('typescript');
  });

  it('should detect Python', () => {
    expect(detectLanguage('script.py')).toBe('python');
  });

  it('should default to text for unknown extensions', () => {
    expect(detectLanguage('file.xyz')).toBe('text');
  });
});

describe('formatBytes', () => {
  it('should format bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('should format fractional values', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(1500)).toBe('1s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(75000)).toBe('1m 15s');
  });
});
