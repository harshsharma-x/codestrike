import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthPayload {
  userId: string;
  email: string;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'codestrike-dev-secret';
    const decoded = jwt.default.verify(token, secret) as AuthPayload;

    (request as any).user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuth(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return;

  const token = authHeader.slice(7);

  try {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'codestrike-dev-secret';
    const decoded = jwt.default.verify(token, secret) as AuthPayload;
    (request as any).user = decoded;
  } catch {
    // silently ignore invalid tokens
  }
}
