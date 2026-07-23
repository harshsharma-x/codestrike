import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { PrismaClient };
export type { User, Session, Project, Conversation, Message, Index, Configuration, UsageLog } from '@prisma/client';

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] Connected successfully');
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function createUser(data: {
  email: string;
  name?: string;
  passwordHash?: string;
  githubId?: string;
  googleId?: string;
}) {
  return prisma.user.create({ data });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, include: { projects: true } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByGithubId(githubId: string) {
  return prisma.user.findUnique({ where: { githubId } });
}

export async function getUserByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId } });
}

export async function createProject(data: {
  name: string;
  rootDir: string;
  userId: string;
  model?: string;
  provider?: string;
}) {
  return prisma.project.create({ data });
}

export async function getProjectsByUserId(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

export async function createConversation(data: {
  title?: string;
  projectId?: string;
  userId?: string;
}) {
  return prisma.conversation.create({
    data: {
      title: data.title || 'New Conversation',
      projectId: data.projectId,
      userId: data.userId,
    },
  });
}

export async function getConversationsByProjectId(projectId: string) {
  return prisma.conversation.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
  });
}

export async function createMessage(data: {
  conversationId: string;
  role: string;
  content: string;
  model?: string;
  provider?: string;
  tokens?: number;
  metadata?: Record<string, unknown>;
}) {
  return prisma.message.create({ data: { ...data, metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue } });
}

export async function getMessagesByConversationId(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function upsertIndex(data: {
  projectId: string;
  filePath: string;
  content: string;
  summary: string;
  language: string;
  tokens: number;
  embeddings?: number[];
}) {
  return prisma.index.upsert({
    where: { projectId_filePath: { projectId: data.projectId, filePath: data.filePath } },
    create: data,
    update: {
      content: data.content,
      summary: data.summary,
      tokens: data.tokens,
      embeddings: data.embeddings,
      lastIndexed: new Date(),
    },
  });
}

export async function getIndexByProjectId(projectId: string) {
  return prisma.index.findMany({ where: { projectId } });
}

export async function deleteIndex(projectId: string, filePath: string) {
  return prisma.index.delete({
    where: { projectId_filePath: { projectId, filePath } },
  });
}

export async function logUsage(data: {
  userId?: string;
  action: string;
  provider: string;
  model: string;
  tokens?: number;
  duration?: number;
  status: string;
  error?: string;
}) {
  return prisma.usageLog.create({ data });
}

export async function getUsageLogs(userId?: string, limit = 100) {
  return prisma.usageLog.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function upsertConfiguration(userId: string, key: string, value: string) {
  return prisma.configuration.upsert({
    where: { key },
    create: { userId, key, value },
    update: { value, userId },
  });
}

export async function getConfiguration(userId: string, key: string) {
  return prisma.configuration.findUnique({
    where: { key },
  });
}

export async function getAllConfigurations(userId: string) {
  return prisma.configuration.findMany({ where: { userId } });
}
