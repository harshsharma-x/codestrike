import { describe, it, expect } from 'vitest';
import { buildServer } from './index';

describe('Server', () => {
  it('GET /health returns status ok', async () => {
    const server = await buildServer();
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeGreaterThan(0);
  });

  it('health endpoint returns number timestamp', async () => {
    const server = await buildServer();
    const res = await server.inject({ method: 'GET', url: '/health' });
    const body = JSON.parse(res.body);
    expect(typeof body.timestamp).toBe('number');
  });
});
