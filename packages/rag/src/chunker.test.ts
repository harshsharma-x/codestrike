import { describe, it, expect } from 'vitest';
import { chunkContent, estimateTokens, mergeChunks } from './chunker';

describe('chunkContent', () => {
  it('should not chunk small content', () => {
    const content = 'line1\nline2\nline3';
    const chunks = chunkContent(content, 'test.txt', 1000);
    expect(chunks).toHaveLength(1);
  });

  it('should chunk large content', () => {
    const content = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
    const chunks = chunkContent(content, 'test.txt', 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should assign correct file paths', () => {
    const chunks = chunkContent('hello\nworld', 'src/file.ts', 1000);
    expect(chunks[0].id).toContain('src/file.ts');
  });
});

describe('estimateTokens', () => {
  it('should estimate tokens', () => {
    expect(estimateTokens('hello world')).toBe(3);
  });

  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('mergeChunks', () => {
  it('should merge chunks that fit within token limit', () => {
    const chunks = [
      { id: '1', content: 'hello', index: 0, startLine: 0, endLine: 0, tokens: 2 },
      { id: '2', content: 'world', index: 1, startLine: 1, endLine: 1, tokens: 2 },
    ];
    const merged = mergeChunks(chunks, 10);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('hello\nworld');
  });

  it('should not merge chunks exceeding token limit', () => {
    const chunks = [
      { id: '1', content: 'hello', index: 0, startLine: 0, endLine: 0, tokens: 10 },
      { id: '2', content: 'world', index: 1, startLine: 1, endLine: 1, tokens: 10 },
    ];
    const merged = mergeChunks(chunks, 15);
    expect(merged).toHaveLength(2);
  });
});
