import { describe, it, expect } from 'vitest';
import { semanticSearch, findRelevantContext } from './search';
import { IndexEntry } from '@codestrike/shared';

const mockEntries: IndexEntry[] = [
  {
    id: '1',
    path: 'src/auth.ts',
    content: 'export function login() { return true; }',
    summary: 'Authentication functions',
    language: 'typescript',
    tokens: 10,
    embeddings: [],
    lastIndexed: Date.now(),
    dependencies: [],
    exports: ['login'],
    imports: [],
  },
  {
    id: '2',
    path: 'src/db.ts',
    content: 'export function query(sql: string) { return []; }',
    summary: 'Database query functions',
    language: 'typescript',
    tokens: 10,
    embeddings: [],
    lastIndexed: Date.now(),
    dependencies: [],
    exports: ['query'],
    imports: [],
  },
  {
    id: '3',
    path: 'src/utils.ts',
    content: 'export function formatDate() { return ""; }',
    summary: 'Utility functions',
    language: 'typescript',
    tokens: 10,
    embeddings: [],
    lastIndexed: Date.now(),
    dependencies: [],
    exports: ['formatDate'],
    imports: [],
  },
];

describe('semanticSearch', () => {
  it('should find results by path match', () => {
    const results = semanticSearch('auth', mockEntries);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.path).toContain('auth');
  });

  it('should find results by content match', () => {
    const results = semanticSearch('database', mockEntries);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should find results by export match', () => {
    const results = semanticSearch('query', mockEntries);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should respect max results limit', () => {
    const results = semanticSearch('function', mockEntries, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array for no matches', () => {
    const results = semanticSearch('xyznonexistent', mockEntries);
    expect(results).toHaveLength(0);
  });

  it('should score results in descending order', () => {
    const results = semanticSearch('login', mockEntries);
    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    }
  });
});

describe('findRelevantContext', () => {
  it('should return context string', () => {
    const context = findRelevantContext('login auth', mockEntries, 1000);
    expect(context.length).toBeGreaterThan(0);
    expect(context).toContain('src/auth.ts');
  });

  it('should limit by tokens', () => {
    const context = findRelevantContext('function', mockEntries, 10);
    expect(context.length).toBeLessThan(200);
  });
});
