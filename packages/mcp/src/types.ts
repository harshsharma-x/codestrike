import { z } from 'zod';

export const MCPServerConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  transport: z.enum(['stdio', 'http']),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  enabled: z.boolean().default(true),
});

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  serverName: string;
}

export interface MCPPromptDefinition {
  name: string;
  description?: string;
  arguments?: { name: string; description?: string; required?: boolean }[];
  serverName: string;
}

export interface MCPCallToolResult {
  content: { type: 'text' | 'image' | 'resource'; text?: string; data?: string; mimeType?: string }[];
  isError?: boolean;
}

export interface MCPReadResourceResult {
  contents: { uri: string; text?: string; blob?: string; mimeType?: string }[];
}

export interface MCPGetPromptResult {
  description?: string;
  messages: { role: 'user' | 'assistant'; content: { type: 'text'; text: string } }[];
}

export type MCPProviderStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface MCPJSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPJSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
}

export interface MCPJSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}
