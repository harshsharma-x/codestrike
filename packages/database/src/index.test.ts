import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUserCreate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();
const mockProjectCreate = vi.fn();
const mockProjectFindMany = vi.fn();
const mockProjectFindUnique = vi.fn();
const mockConversationCreate = vi.fn();
const mockConversationFindMany = vi.fn();
const mockMessageCreate = vi.fn();
const mockMessageFindMany = vi.fn();
const mockIndexUpsert = vi.fn();
const mockIndexFindMany = vi.fn();
const mockIndexDelete = vi.fn();
const mockUsageLogCreate = vi.fn();
const mockUsageLogFindMany = vi.fn();
const mockConfigurationUpsert = vi.fn();
const mockConfigurationFindUnique = vi.fn();
const mockConfigurationFindMany = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $connect: mockConnect,
    $disconnect: mockDisconnect,
    user: {
      create: mockUserCreate,
      findUnique: mockUserFindUnique,
      findMany: mockUserFindMany,
    },
    project: {
      create: mockProjectCreate,
      findMany: mockProjectFindMany,
      findUnique: mockProjectFindUnique,
    },
    conversation: {
      create: mockConversationCreate,
      findMany: mockConversationFindMany,
    },
    message: {
      create: mockMessageCreate,
      findMany: mockMessageFindMany,
    },
    index: {
      upsert: mockIndexUpsert,
      findMany: mockIndexFindMany,
      delete: mockIndexDelete,
    },
    usageLog: {
      create: mockUsageLogCreate,
      findMany: mockUsageLogFindMany,
    },
    configuration: {
      upsert: mockConfigurationUpsert,
      findUnique: mockConfigurationFindUnique,
      findMany: mockConfigurationFindMany,
    },
  })),
  Prisma: {
    InputJsonValue: {},
  },
}));

describe('Database', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export connectDatabase function', async () => {
    const { connectDatabase } = await import('./index');
    expect(connectDatabase).toBeDefined();
    expect(typeof connectDatabase).toBe('function');
  });

  it('should export disconnectDatabase function', async () => {
    const { disconnectDatabase } = await import('./index');
    expect(disconnectDatabase).toBeDefined();
    expect(typeof disconnectDatabase).toBe('function');
  });

  it('connectDatabase calls prisma.$connect', async () => {
    const { connectDatabase } = await import('./index');
    mockConnect.mockResolvedValue(undefined);
    await connectDatabase();
    expect(mockConnect).toHaveBeenCalledOnce();
  });

  it('disconnectDatabase calls prisma.$disconnect', async () => {
    const { disconnectDatabase } = await import('./index');
    mockDisconnect.mockResolvedValue(undefined);
    await disconnectDatabase();
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it('connectDatabase throws on connection failure', async () => {
    const { connectDatabase } = await import('./index');
    mockConnect.mockRejectedValue(new Error('connection refused'));
    await expect(connectDatabase()).rejects.toThrow('connection refused');
  });

  it('createUser calls prisma.user.create with data', async () => {
    const { createUser } = await import('./index');
    const userData = { email: 'test@example.com', name: 'Test' };
    mockUserCreate.mockResolvedValue({ id: '1', ...userData });
    const result = await createUser(userData);
    expect(mockUserCreate).toHaveBeenCalledWith({ data: userData });
    expect(result).toEqual({ id: '1', ...userData });
  });

  it('getUserByEmail calls prisma.user.findUnique with email', async () => {
    const { getUserByEmail } = await import('./index');
    mockUserFindUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
    const result = await getUserByEmail('test@example.com');
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: { projects: true },
    });
    expect(result).toEqual({ id: '1', email: 'test@example.com' });
  });

  it('createProject calls prisma.project.create', async () => {
    const { createProject } = await import('./index');
    const projectData = { name: 'Test', rootDir: '/test', userId: '1' };
    mockProjectCreate.mockResolvedValue({ id: '1', ...projectData });
    const result = await createProject(projectData);
    expect(mockProjectCreate).toHaveBeenCalledWith({ data: projectData });
    expect(result).toEqual({ id: '1', ...projectData });
  });

  it('createConversation returns default title when none provided', async () => {
    const { createConversation } = await import('./index');
    mockConversationCreate.mockResolvedValue({ id: '1', title: 'New Conversation' });
    const result = await createConversation({ projectId: 'p1', userId: 'u1' });
    expect(mockConversationCreate).toHaveBeenCalledWith({
      data: { title: 'New Conversation', projectId: 'p1', userId: 'u1' },
    });
    expect(result.title).toBe('New Conversation');
  });

  it('getProjectsByUserId orders by updatedAt desc', async () => {
    const { getProjectsByUserId } = await import('./index');
    mockProjectFindMany.mockResolvedValue([]);
    await getProjectsByUserId('u1');
    expect(mockProjectFindMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('exports all expected functions', async () => {
    const mod = await import('./index');
    const expected = [
      'connectDatabase',
      'disconnectDatabase',
      'createUser',
      'getUserByEmail',
      'getUserById',
      'getUserByGithubId',
      'getUserByGoogleId',
      'createProject',
      'getProjectsByUserId',
      'getProjectById',
      'createConversation',
      'getConversationsByProjectId',
      'createMessage',
      'getMessagesByConversationId',
      'upsertIndex',
      'getIndexByProjectId',
      'deleteIndex',
      'logUsage',
      'getUsageLogs',
      'upsertConfiguration',
      'getConfiguration',
      'getAllConfigurations',
    ];
    for (const name of expected) {
      expect(mod[name]).toBeDefined();
      expect(typeof mod[name]).toBe('function');
    }
  });
});
