export class CodeStrikeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CodeStrikeError';
  }
}

export class AIProviderError extends CodeStrikeError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AI_PROVIDER_ERROR', 502, details);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends CodeStrikeError {
  constructor(message = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super(message, 'AI_PROVIDER_RATE_LIMIT', 429, details);
    this.name = 'RateLimitError';
  }
}

export class ProviderTimeoutError extends CodeStrikeError {
  constructor(message = 'Provider request timed out', details?: Record<string, unknown>) {
    super(message, 'AI_PROVIDER_TIMEOUT', 504, details);
    this.name = 'ProviderTimeoutError';
  }
}

export class InvalidApiKeyError extends CodeStrikeError {
  constructor(provider: string) {
    super(`Invalid API key for provider: ${provider}`, 'INVALID_API_KEY', 401, { provider });
    this.name = 'InvalidApiKeyError';
  }
}

export class GitError extends CodeStrikeError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'GIT_ERROR', 500, details);
    this.name = 'GitError';
  }
}

export class FileSystemError extends CodeStrikeError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FILE_SYSTEM_ERROR', 500, details);
    this.name = 'FileSystemError';
  }
}

export function handleError(error: unknown): CodeStrikeError {
  if (error instanceof CodeStrikeError) return error;
  if (error instanceof Error) {
    return new CodeStrikeError(error.message, 'INTERNAL_ERROR', 500, {
      originalName: error.name,
    });
  }
  return new CodeStrikeError('An unknown error occurred', 'INTERNAL_ERROR', 500);
}
