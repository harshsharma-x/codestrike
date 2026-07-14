import { ToolDefinition, ToolResult } from './types';
import { FileTools } from './file';
import { ShellTools } from './shell';
import { GitTools } from './git';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private fileTools: FileTools;
  shellTools: ShellTools;
  private gitTools: GitTools;

  constructor(workingDir?: string) {
    this.fileTools = new FileTools(workingDir);
    this.shellTools = new ShellTools(workingDir);
    this.gitTools = new GitTools(workingDir);
    this.registerDefaults();
  }

  private registerDefaults(): void {
    for (const t of this.fileTools.toToolDefinitions()) this.register(t);
    for (const t of this.shellTools.toToolDefinitions()) this.register(t);
    for (const t of this.gitTools.toToolDefinitions()) this.register(t);
  }

  register(def: ToolDefinition): void {
    this.tools.set(def.name, def);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getByCategory(category: string): ToolDefinition[] {
    return this.getAll().filter(t => t.category === category);
  }

  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) return { success: false, error: `Unknown tool: ${name}` };
    try {
      return await tool.execute(args);
    } catch (error) {
      return { success: false, error: `Tool ${name} failed: ${error}` };
    }
  }
}
