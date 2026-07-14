export type ToolCategory = 'file' | 'shell' | 'git' | 'code' | 'search';

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute(args: Record<string, unknown>): Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface FileContent {
  path: string;
  content: string;
  language?: string;
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
}
