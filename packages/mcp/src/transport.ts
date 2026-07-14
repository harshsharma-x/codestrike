import { ChildProcess, spawn } from 'child_process';
import { MCPJSONRPCRequest, MCPJSONRPCResponse, MCPServerConfig } from './types';

export interface MCPTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: MCPJSONRPCRequest): Promise<MCPJSONRPCResponse>;
  onNotification(handler: (notification: any) => void): void;
  isConnected(): boolean;
}

export class StdioTransport implements MCPTransport {
  private process: ChildProcess | null = null;
  private buffer = '';
  private pending = new Map<string | number, { resolve: (value: MCPJSONRPCResponse) => void; reject: (err: Error) => void }>();
  private notificationHandler: ((notification: any) => void) | null = null;
  private msgId = 0;
  private connected = false;
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const cmd = this.config.command;
    if (!cmd) throw new Error('No command specified for stdio transport');

    this.process = spawn(cmd, this.config.args || [], {
      env: { ...process.env, ...this.config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      // MCP servers may log to stderr
    });

    this.process.on('close', (code) => {
      this.connected = false;
      for (const [, pending] of this.pending) {
        pending.reject(new Error(`MCP server process exited with code ${code}`));
      }
      this.pending.clear();
    });

    this.process.on('error', (err) => {
      this.connected = false;
      for (const [, pending] of this.pending) {
        pending.reject(err);
      }
      this.pending.clear();
    });

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async send(message: MCPJSONRPCRequest): Promise<MCPJSONRPCResponse> {
    return new Promise((resolve, reject) => {
      const id = message.id;
      this.pending.set(id, { resolve, reject });

      const line = JSON.stringify(message) + '\n';
      this.process?.stdin?.write(line);

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`MCP request timed out: ${message.method}`));
        }
      }, 30000);
    });
  }

  onNotification(handler: (notification: any) => void): void {
    this.notificationHandler = handler;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const msg = JSON.parse(trimmed);

        if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
          const pending = this.pending.get(msg.id);
          if (pending) {
            this.pending.delete(msg.id);
            pending.resolve(msg as MCPJSONRPCResponse);
          }
        } else if (msg.method !== undefined) {
          this.notificationHandler?.(msg);
        }
      } catch {
        // skip malformed JSON
      }
    }
  }
}

export class HTTPTransport implements MCPTransport {
  private url: string;
  private connected = false;
  private notificationHandler: ((notification: any) => void) | null = null;
  private abortController: AbortController | null = null;

  constructor(config: MCPServerConfig) {
    if (!config.url) throw new Error('No URL specified for HTTP transport');
    this.url = config.url;
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.abortController = new AbortController();
    this.startSSE();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.abortController?.abort();
    this.abortController = null;
  }

  async send(message: MCPJSONRPCRequest): Promise<MCPJSONRPCResponse> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`MCP HTTP error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  onNotification(handler: (notification: any) => void): void {
    this.notificationHandler = handler;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async startSSE(): Promise<void> {
    try {
      const response = await fetch(this.url + '/sse', {
        signal: this.abortController?.signal,
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (this.connected) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const dataLine = event.split('\n').find(l => l.startsWith('data: '));
          if (dataLine) {
            try {
              const data = JSON.parse(dataLine.slice(6));
              this.notificationHandler?.(data);
            } catch { /* */ }
          }
        }
      }
    } catch {
      // SSE stream ended or was aborted
    }
  }
}

export function createTransport(config: MCPServerConfig): MCPTransport {
  switch (config.transport) {
    case 'stdio':
      return new StdioTransport(config);
    case 'http':
      return new HTTPTransport(config);
    default:
      throw new Error(`Unsupported MCP transport: ${config.transport}`);
  }
}
