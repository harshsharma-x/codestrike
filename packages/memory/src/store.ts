import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';

const STORAGE_PATH = join(homedir(), '.codestrike', 'memory.json');

interface Data {
  sessions: Record<string, { provider: string; model: string; messages: unknown[]; created_at: string; updated_at: string }>;
  preferences: Record<string, { value: string; updated_at: string }>;
  projectMemory: Record<string, Record<string, { value: string; updated_at: string }>>;
  commands: Array<{ command: string; args: string | null; timestamp: string }>;
  favorites: Array<{ type: string; value: string; label: string | null; created_at: string }>;
}

export class MemoryStore {
  private data: Data;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || STORAGE_PATH;
    const dir = this.dbPath.replace(/\/[^/]+$/, '');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.data = this.load();
  }

  private load(): Data {
    try {
      return JSON.parse(readFileSync(this.dbPath, 'utf-8'));
    } catch {
      return { sessions: {}, preferences: {}, projectMemory: {}, commands: [], favorites: [] };
    }
  }

  private save(): void {
    writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  private ts(): string {
    return new Date().toISOString();
  }

  saveSession(id: string, provider: string, model: string, messages: unknown[]): void {
    const now = this.ts();
    this.data.sessions[id] = { provider, model, messages, created_at: this.data.sessions[id]?.created_at || now, updated_at: now };
    this.save();
  }

  getSession(id: string): { id: string; provider: string; model: string; messages: unknown[] } | null {
    const s = this.data.sessions[id];
    if (!s) return null;
    return { id, ...s };
  }

  listSessions(limit = 20): Array<{ id: string; provider: string; model: string; created_at: string }> {
    return Object.entries(this.data.sessions)
      .sort(([, a], [, b]) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, limit)
      .map(([id, s]) => ({ id, provider: s.provider, model: s.model, created_at: s.created_at }));
  }

  deleteSession(id: string): void {
    delete this.data.sessions[id];
    this.save();
  }

  setPreference(key: string, value: unknown): void {
    this.data.preferences[key] = { value: JSON.stringify(value), updated_at: this.ts() };
    this.save();
  }

  getPreference<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const entry = this.data.preferences[key];
    if (!entry) return defaultValue;
    try { return JSON.parse(entry.value); } catch { return entry.value as T; }
  }

  getAllPreferences(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(this.data.preferences)) {
      try { result[k] = JSON.parse(v.value); } catch { result[k] = v.value; }
    }
    return result;
  }

  setProjectMemory(projectPath: string, key: string, value: unknown): void {
    if (!this.data.projectMemory[projectPath]) this.data.projectMemory[projectPath] = {};
    this.data.projectMemory[projectPath][key] = { value: JSON.stringify(value), updated_at: this.ts() };
    this.save();
  }

  getProjectMemory<T = unknown>(projectPath: string, key: string): T | undefined {
    const entry = this.data.projectMemory[projectPath]?.[key];
    if (!entry) return undefined;
    try { return JSON.parse(entry.value); } catch { return entry.value as T; }
  }

  addCommand(command: string, args?: string): void {
    this.data.commands.push({ command, args: args || null, timestamp: this.ts() });
    if (this.data.commands.length > 100) this.data.commands = this.data.commands.slice(-100);
    this.save();
  }

  getRecentCommands(limit = 20): Array<{ command: string; args: string | null; timestamp: string }> {
    return this.data.commands.slice(-limit).reverse();
  }

  addFavorite(type: string, value: string, label?: string): void {
    if (!this.data.favorites.some(f => f.type === type && f.value === value)) {
      this.data.favorites.push({ type, value, label: label || null, created_at: this.ts() });
      this.save();
    }
  }

  removeFavorite(type: string, value: string): void {
    this.data.favorites = this.data.favorites.filter(f => !(f.type === type && f.value === value));
    this.save();
  }

  getFavorites(type?: string): Array<{ type: string; value: string; label: string | null }> {
    const items = type ? this.data.favorites.filter(f => f.type === type) : this.data.favorites;
    return items.slice().reverse();
  }

  close(): void {
    this.save();
  }
}
