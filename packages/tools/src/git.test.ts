import { describe, it, expect } from 'vitest';

describe('GitTools', () => {
  it('should have git installed and return status', async () => {
    const { GitTools } = await import('./git');
    const tools = new GitTools();
    const result = await tools.status();
    expect(result.success).toBe(true);
    expect(result.data.status).toBeDefined();
  });

  it('should return current branch', async () => {
    const { GitTools } = await import('./git');
    const tools = new GitTools();
    const result = await tools.branch();
    expect(result.success).toBe(true);
    expect(result.data.branch).toBeTruthy();
  });

  it('should return recent commits', async () => {
    const { GitTools } = await import('./git');
    const tools = new GitTools();
    const result = await tools.log(5);
    expect(result.success).toBe(true);
    expect(result.data.commits.length).toBeLessThanOrEqual(5);
  });

  it('should export tool definitions', async () => {
    const { GitTools } = await import('./git');
    const tools = new GitTools();
    const defs = tools.toToolDefinitions();
    expect(defs.length).toBe(5);
    expect(defs[0].name).toBe('git_status');
    expect(defs[1].name).toBe('git_diff');
    expect(defs[2].name).toBe('git_commit');
    expect(defs[3].name).toBe('git_log');
    expect(defs[4].name).toBe('git_branch');
  });
});
