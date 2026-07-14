import { EventEmitter } from 'events';
import { generateId, timestamp, TerminalSession } from '@codestrike/shared';
import { Logger } from '@codestrike/core';

export interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'input' | 'system';
  data: string;
  timestamp: number;
}

export class TerminalSessionManager extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private outputs: Map<string, TerminalOutput[]> = new Map();
  private logger = new Logger('TerminalSession');

  createSession(cwd: string): TerminalSession {
    const session: TerminalSession = {
      id: generateId(),
      cwd,
      commands: 0,
      createdAt: timestamp(),
      lastActive: timestamp(),
    };

    this.sessions.set(session.id, session);
    this.outputs.set(session.id, []);
    this.logger.info(`Created session: ${session.id}`);

    return session;
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  getOutputs(sessionId: string): TerminalOutput[] {
    return this.outputs.get(sessionId) || [];
  }

  addOutput(sessionId: string, output: TerminalOutput): void {
    const outputs = this.outputs.get(sessionId);
    if (outputs) {
      outputs.push(output);
      this.emit('output', { sessionId, output });
    }
  }

  updateCommandCount(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.commands++;
      session.lastActive = timestamp();
    }
  }

  destroySession(id: string): void {
    this.sessions.delete(id);
    this.outputs.delete(id);
    this.emit('destroyed', id);
  }

  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  clearOutput(sessionId: string): void {
    this.outputs.set(sessionId, []);
  }
}
