import { execSync } from 'child_process';
import { ToolDefinition, ToolResult } from './types';

export class GitTools {
  private workingDir: string;

  constructor(workingDir?: string) {
    this.workingDir = workingDir || process.cwd();
  }

  git(args: string): string {
    try {
      return execSync(`git ${args}`, { cwd: this.workingDir, encoding: 'utf-8', timeout: 10000 }).trim();
    } catch {
      return '';
    }
  }

  async status(): Promise<ToolResult> {
    const status = this.git('status --short');
    return { success: true, data: { status: status || 'Clean working directory' } };
  }

  async diff(): Promise<ToolResult> {
    const diff = this.git('diff');
    return { success: true, data: { diff } };
  }

  async commit(message: string): Promise<ToolResult> {
    this.git('add -A');
    const result = this.git(`commit -m "${message.replace(/"/g, '\\"')}"`);
    if (!result) return { success: false, error: 'Commit failed' };
    return { success: true, data: { message: result } };
  }

  async log(limit = 10): Promise<ToolResult> {
    const log = this.git(`log --oneline -${limit}`);
    return { success: true, data: { commits: log.split('\n').filter(Boolean) } };
  }

  async branch(): Promise<ToolResult> {
    const branch = this.git('branch --show-current');
    return { success: true, data: { branch } };
  }

  toToolDefinitions(): ToolDefinition[] {
    const self = this;
    return [
      { name: 'git_status', description: 'Show working tree status', category: 'git', parameters: {}, execute: () => self.status() },
      { name: 'git_diff', description: 'Show unstaged changes', category: 'git', parameters: {}, execute: () => self.diff() },
      { name: 'git_commit', description: 'Stage all changes and commit', category: 'git', parameters: { message: { type: 'string', description: 'Commit message', required: true } }, execute: (args) => self.commit(args.message as string) },
      { name: 'git_log', description: 'Show recent commits', category: 'git', parameters: { limit: { type: 'number', description: 'Number of commits' } }, execute: (args) => self.log((args.limit as number) || 10) },
      { name: 'git_branch', description: 'Show current branch', category: 'git', parameters: {}, execute: () => self.branch() },
    ];
  }
}
