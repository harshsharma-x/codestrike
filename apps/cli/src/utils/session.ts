import Conf from 'conf';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  provider: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const store = new Conf<{ sessions: Record<string, ChatSession>; currentId: string | null }>({
  projectName: 'codestrike',
  schema: {
    sessions: { type: 'object', default: {} },
    currentId: { type: ['string', 'null'], default: null },
  },
});

export function saveSession(session: ChatSession): void {
  const sessions = store.get('sessions');
  sessions[session.id] = session;
  store.set('sessions', sessions);
}

export function loadSession(id: string): ChatSession | undefined {
  const sessions = store.get('sessions');
  return sessions[id];
}

export function listSessions(): ChatSession[] {
  const sessions = store.get('sessions');
  return Object.values(sessions).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function deleteSession(id: string): void {
  const sessions = store.get('sessions');
  delete sessions[id];
  store.set('sessions', sessions);
}

export function setCurrentSession(id: string | null): void {
  store.set('currentId', id);
}

export function getCurrentSessionId(): string | null {
  return store.get('currentId');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
