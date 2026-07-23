import type { ProviderName } from '@codestrike/ai';

const DEFAULT_MODEL = 'mistralai/mixtral-8x7b-instruct';
const DEFAULT_PROVIDER: ProviderName = 'openrouter';

export function getDefaultProvider(): ProviderName {
  return (process.env.CODESTRIKE_DEFAULT_PROVIDER || DEFAULT_PROVIDER) as ProviderName;
}

export function getDefaultModel(): string {
  return process.env.CODESTRIKE_DEFAULT_MODEL || DEFAULT_MODEL;
}
