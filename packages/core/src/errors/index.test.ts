import { describe, it, expect } from 'vitest';
import {
  CodeStrikeError,
  AIProviderError,
  RateLimitError,
  ProviderTimeoutError,
  InvalidApiKeyError,
  GitError,
  FileSystemError,
  handleError,
} from './index';

describe('CodeStrikeError', () => {
  it('should create an error with code and status', () => {
    const err = new CodeStrikeError('test', 'TEST_ERROR', 400);
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('CodeStrikeError');
  });

  it('should include details', () => {
    const err = new CodeStrikeError('test', 'ERR', 500, { detail: 'info' });
    expect(err.details).toEqual({ detail: 'info' });
  });
});

describe('AIProviderError', () => {
  it('should have correct status code', () => {
    const err = new AIProviderError('API error');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('AI_PROVIDER_ERROR');
  });
});

describe('RateLimitError', () => {
  it('should have rate limit code', () => {
    const err = new RateLimitError();
    expect(err.code).toBe('AI_PROVIDER_RATE_LIMIT');
    expect(err.statusCode).toBe(429);
  });
});

describe('ProviderTimeoutError', () => {
  it('should have timeout code', () => {
    const err = new ProviderTimeoutError();
    expect(err.code).toBe('AI_PROVIDER_TIMEOUT');
    expect(err.statusCode).toBe(504);
  });
});

describe('InvalidApiKeyError', () => {
  it('should include provider name', () => {
    const err = new InvalidApiKeyError('openrouter');
    expect(err.message).toContain('openrouter');
    expect(err.code).toBe('INVALID_API_KEY');
  });
});

describe('GitError', () => {
  it('should have git error code', () => {
    const err = new GitError('merge conflict');
    expect(err.code).toBe('GIT_ERROR');
  });
});

describe('FileSystemError', () => {
  it('should have filesystem error code', () => {
    const err = new FileSystemError('permission denied');
    expect(err.code).toBe('FILE_SYSTEM_ERROR');
  });
});

describe('handleError', () => {
  it('should return CodeStrikeError as-is', () => {
    const original = new CodeStrikeError('test', 'CODE');
    const handled = handleError(original);
    expect(handled).toBe(original);
  });

  it('should wrap regular Error', () => {
    const err = handleError(new Error('regular'));
    expect(err).toBeInstanceOf(CodeStrikeError);
    expect(err.message).toBe('regular');
  });

  it('should wrap unknown errors', () => {
    const err = handleError('string error');
    expect(err).toBeInstanceOf(CodeStrikeError);
    expect(err.message).toBe('An unknown error occurred');
  });
});
