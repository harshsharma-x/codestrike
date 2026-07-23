import Conf from 'conf';
import { createHash } from 'crypto';
import { hostname } from 'os';
import { execSync } from 'child_process';

export interface AuthToken {
  provider: 'github' | 'google';
  accessToken: string;
  refreshToken?: string;
  userInfo: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  expiresAt?: number;
  scope: string[];
}

export interface StoredApiKey {
  provider: string;
  key: string;
  label?: string;
  validated: boolean;
  createdAt: string;
}

interface AuthData {
  tokens: Record<string, AuthToken>;
  apiKeys: Record<string, StoredApiKey>;
  currentProvider: string | null;
  settings: {
    autoSync: boolean;
    lastSync: string | null;
    completedSetup: boolean;
  };
}

const store = new Conf<AuthData>({
  projectName: 'codestrike-auth',
  schema: {
    tokens: { type: 'object', default: {} },
    apiKeys: { type: 'object', default: {} },
    currentProvider: { type: ['string', 'null'], default: null },
    settings: {
      type: 'object',
      default: { autoSync: false, lastSync: null, completedSetup: false },
    },
  },
});

function machineId(): string {
  const parts: string[] = [];
  try {
    parts.push(hostname());
    parts.push(process.env.USER || process.env.USERNAME || 'user');
    try {
      const out = execSync('cat /etc/machine-id 2>/dev/null || echo 0000', {
        encoding: 'utf-8',
        timeout: 1000,
      });
      parts.push(out.trim());
    } catch {
      /* non-fatal */
    }
  } catch {
    /* non-fatal */
  }
  return createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 16);
}

export function obfuscate(text: string): string {
  const key = machineId().padEnd(16, '0').slice(0, 16);
  const buf = Buffer.from(text, 'utf-8');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ key.charCodeAt(i % key.length);
  }
  return out.toString('base64');
}

export function deobfuscate(encoded: string): string {
  const key = machineId().padEnd(16, '0').slice(0, 16);
  const buf = Buffer.from(encoded, 'base64');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ key.charCodeAt(i % key.length);
  }
  return out.toString('utf-8');
}

// ── Auth Tokens ──

export function saveToken(token: AuthToken): void {
  const tokens = store.get('tokens');
  const stored = { ...token, accessToken: obfuscate(token.accessToken) };
  if (token.refreshToken) stored.refreshToken = obfuscate(token.refreshToken);
  tokens[token.provider] = stored;
  store.set('tokens', tokens);
  store.set('currentProvider', token.provider);
}

export function getToken(provider: string): AuthToken | undefined {
  const tokens = store.get('tokens');
  const raw = tokens[provider];
  if (!raw) return undefined;
  return {
    ...raw,
    accessToken: deobfuscate(raw.accessToken),
    refreshToken: raw.refreshToken ? deobfuscate(raw.refreshToken) : undefined,
  };
}

export function removeToken(provider: string): void {
  const tokens = store.get('tokens');
  delete tokens[provider];
  store.set('tokens', tokens);
  if (store.get('currentProvider') === provider) {
    store.set('currentProvider', null);
  }
}

export function clearAllTokens(): void {
  store.set('tokens', {});
  store.set('currentProvider', null);
}

export function getCurrentToken(): AuthToken | undefined {
  const provider = store.get('currentProvider');
  return provider ? getToken(provider) : undefined;
}

export function getAllTokens(): AuthToken[] {
  return Object.values(store.get('tokens')).map((t) => ({
    ...t,
    accessToken: deobfuscate(t.accessToken),
    refreshToken: t.refreshToken ? deobfuscate(t.refreshToken) : undefined,
  }));
}

// ── API Keys ──

export function saveApiKey(
  provider: string,
  key: string,
  validated: boolean,
  label?: string,
): void {
  const keys = store.get('apiKeys');
  keys[provider] = {
    provider,
    key: obfuscate(key),
    label,
    validated,
    createdAt: new Date().toISOString(),
  };
  store.set('apiKeys', keys);
}

export function getApiKey(provider: string): string | undefined {
  const keys = store.get('apiKeys');
  const raw = keys[provider];
  return raw ? deobfuscate(raw.key) : undefined;
}

export function removeApiKey(provider: string): void {
  const keys = store.get('apiKeys');
  delete keys[provider];
  store.set('apiKeys', keys);
}

export function listApiKeys(): StoredApiKey[] {
  const keys = store.get('apiKeys');
  return Object.values(keys).map((k) => ({ ...k, key: '•••' + deobfuscate(k.key).slice(-4) }));
}

export function hasApiKey(provider: string): boolean {
  return !!store.get('apiKeys')[provider];
}

// ── Settings ──

export function getSettings() {
  return store.get('settings');
}

export function setSettings(s: Partial<AuthData['settings']>): void {
  store.set('settings', { ...store.get('settings'), ...s });
}

export function isSetupComplete(): boolean {
  return store.get('settings').completedSetup;
}

export function markSetupComplete(): void {
  store.set('settings', { ...store.get('settings'), completedSetup: true });
}
