import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { configRoutes } from './config';

const mockExistsSync = vi.fn().mockReturnValue(false);
const mockReadFileSync = vi.fn();
const mockWriteFileSync = vi.fn();
const mockMkdirSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
}));

describe('Config routes', () => {
  async function buildTestServer() {
    const server = Fastify();
    await server.register(configRoutes, { prefix: '/api/config' });
    await server.ready();
    return server;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  it('GET /api/config returns configured: false when no config file', async () => {
    const server = await buildTestServer();
    const res = await server.inject({ method: 'GET', url: '/api/config' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.configured).toBe(false);
    expect(body.apiKeys).toBeDefined();
  });

  it('GET /api/config returns configured: true when config file exists', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ model: 'gpt-4' }));
    const server = await buildTestServer();
    const res = await server.inject({ method: 'GET', url: '/api/config' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.configured).toBe(true);
    expect(body.model).toBe('gpt-4');
  });

  it('GET /api/config returns error for invalid config file', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('not-json');
    const server = await buildTestServer();
    const res = await server.inject({ method: 'GET', url: '/api/config' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.configured).toBe(false);
    expect(body.error).toBe('Invalid config file');
  });

  it('POST /api/config saves config file', async () => {
    const server = await buildTestServer();
    const res = await server.inject({
      method: 'POST',
      url: '/api/config',
      body: { model: 'gpt-4' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('codestrike.json'),
      JSON.stringify({ model: 'gpt-4' }, null, 2),
    );
  });

  it('POST /api/config returns 400 for unknown provider', async () => {
    const server = await buildTestServer();
    const res = await server.inject({
      method: 'POST',
      url: '/api/config',
      body: { apiKey: 'sk-xxx', provider: 'unknown-xyz' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unknown provider');
  });

  it('POST /api/config saves API key for known provider', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('');
    const server = await buildTestServer();
    const res = await server.inject({
      method: 'POST',
      url: '/api/config',
      body: { apiKey: 'sk-test', provider: 'openai' },
    });
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(true);
    expect(parsed.envKey).toBe('OPENAI_API_KEY');
  });

  it('GET /api/config/env returns provider key status', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const server = await buildTestServer();
    const res = await server.inject({ method: 'GET', url: '/api/config/env' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.providers.OPENAI_API_KEY).toBe(true);
    expect(body.providers.ANTHROPIC_API_KEY).toBe(false);
    delete process.env.OPENAI_API_KEY;
  });
});
