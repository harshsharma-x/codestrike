# CodeStrike Testing Guide

## Test Structure

Tests are co-located with source files using the `*.test.ts` pattern:

```
packages/shared/src/utils.test.ts
packages/ai/src/providers/openrouter.test.ts
apps/cli/src/commands/chat.test.ts
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @codestrike/shared test

# Run tests with coverage
pnpm --filter @codestrike/core test -- --coverage

# Watch mode
pnpm --filter @codestrike/ai test -- --watch
```

## Writing Tests

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { generateId, truncate } from './utils';

describe('generateId', () => {
  it('should generate a 24-character string', () => {
    const id = generateId();
    expect(id).toHaveLength(24);
  });

  it('should only contain valid characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long strings with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('should handle empty strings', () => {
    expect(truncate('', 5)).toBe('');
  });
});
```

### AI Provider Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { OpenRouterProvider } from './openrouter';
import { AICompletionRequest } from '../types';

describe('OpenRouterProvider', () => {
  const provider = new OpenRouterProvider({
    apiKey: 'test-key',
  });

  it('should have correct name and default model', () => {
    expect(provider.name).toBe('openrouter');
    expect(provider.defaultModel).toBe('mistralai/mixtral-8x7b-instruct');
  });

  it('should build correct headers', () => {
    const headers = provider['buildHeaders']();
    expect(headers['Authorization']).toBe('Bearer test-key');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should validate config with API key', async () => {
    const valid = await provider.validateConfig();
    expect(valid).toBe(true);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createRouter } from '../routing';
import { ProviderRegistry } from '../providers/registry';

describe('AI Router Integration', () => {
  it('should create router with default providers', () => {
    const router = createRouter();
    expect(router).toBeDefined();
  });

  it('should have all providers registered', () => {
    const registry = ProviderRegistry.getInstance();
    const providers = registry.getAvailableProviders();
    expect(providers).toContain('openrouter');
    expect(providers).toContain('groq');
    expect(providers).toContain('huggingface');
    expect(providers).toContain('ollama');
    expect(providers).toContain('lmstudio');
  });
});
```

## Test Coverage

```bash
# Generate coverage report
pnpm test -- --coverage

# View HTML report
open coverage/index.html
```

Coverage targets:
- Statements: 80%
- Branches: 75%
- Functions: 85%
- Lines: 80%

## Mocking

```typescript
import { vi } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        choices: [{ message: { content: 'test response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      },
    }),
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

// Mock file system
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue('{}'),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));
```

## Continuous Integration

Tests run automatically on:
- Push to `main` branch
- Pull requests targeting `main`

See `.github/workflows/ci.yml` for the full pipeline.
