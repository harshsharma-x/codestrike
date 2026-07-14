import { describe, it, expect } from 'vitest';
import { parseFile } from './parser';

describe('parseFile', () => {
  it('should parse TypeScript file', () => {
    const content = `
import { foo } from './bar';
export function hello(): void {
  console.log('world');
}
`;
    const result = parseFile('test.ts', content);
    expect(result.language).toBe('typescript');
    expect(result.exports).toContain('hello');
    expect(result.imports).toContain('./bar');
  });

  it('should parse JavaScript file', () => {
    const content = `
const express = require('express');
module.exports = function() {};
`;
    const result = parseFile('server.js', content);
    expect(result.language).toBe('javascript');
  });

  it('should detect Python language', () => {
    const content = 'def hello(): pass';
    const result = parseFile('main.py', content);
    expect(result.language).toBe('python');
  });

  it('should extract Python imports', () => {
    const content = `
import os
from datetime import datetime
def main():
    pass
`;
    const result = parseFile('main.py', content);
    expect(result.imports.length).toBeGreaterThan(0);
  });

  it('should handle empty files', () => {
    const result = parseFile('empty.ts', '');
    expect(result.language).toBe('typescript');
    expect(result.exports).toEqual([]);
    expect(result.imports).toEqual([]);
  });
});
