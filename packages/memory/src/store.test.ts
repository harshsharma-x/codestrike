import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from './store';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore('/dev/null');
  });

  it('should store and retrieve a session', () => {
    store.saveSession('test-id', 'openai', 'gpt-4', ['hello']);
    const session = store.getSession('test-id');
    expect(session).not.toBeNull();
    expect(session!.id).toBe('test-id');
    expect(session!.messages).toEqual(['hello']);
    expect(session!.provider).toBe('openai');
  });

  it('should delete a session', () => {
    store.saveSession('delete-id', 'openai', 'gpt-4', []);
    store.deleteSession('delete-id');
    expect(store.getSession('delete-id')).toBeNull();
  });

  it('should manage project memory', () => {
    store.setProjectMemory('demo', 'files', ['a.ts']);
    const result = store.getProjectMemory('demo', 'files');
    expect(result).toEqual(['a.ts']);
  });

  it('should store command history', () => {
    store.addCommand('git status');
    store.addCommand('ls');
    const cmds = store.getRecentCommands();
    expect(cmds.length).toBe(2);
    expect(cmds[0].command).toBe('ls');
    expect(cmds[1].command).toBe('git status');
  });

  it('should manage favorites', () => {
    store.addFavorite('file', '/path/to/file');
    const favs = store.getFavorites('file');
    expect(favs.length).toBe(1);
    expect(favs[0].value).toBe('/path/to/file');
  });
});
