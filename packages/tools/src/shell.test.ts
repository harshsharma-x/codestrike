import { describe, it, expect } from 'vitest';

describe('ShellTools', () => {
  it('should detect dangerous commands', async () => {
    const { ShellTools } = await import('./shell');
    const tools = new ShellTools();
    expect(tools.isDangerous('rm -rf /')).toBe(true);
    expect(tools.isDangerous('sudo rm -rf')).toBe(true);
    expect(tools.isDangerous('ls -la')).toBe(false);
    expect(tools.isDangerous('echo hello')).toBe(false);
    expect(tools.isDangerous('kill -9 1234')).toBe(true);
  });

  it('should execute a simple command', async () => {
    const { ShellTools } = await import('./shell');
    const tools = new ShellTools();
    const result = await tools.execute('echo hello');
    expect(result.success).toBe(true);
    expect(result.data.stdout.trim()).toBe('hello');
  });

  it('should return error for non-existent command', async () => {
    const { ShellTools } = await import('./shell');
    const tools = new ShellTools();
    const result = await tools.execute('nonexistent_command_xyz123');
    expect(result.success).toBe(false);
  });

  it('should install a package correctly', async () => {
    const { ShellTools } = await import('./shell');
    const tools = new ShellTools();
    const result = await tools.installPackage('unknown-pkg-xyz', 'echo');
    expect(result.success).toBe(true);
  });

  it('should export tool definitions', async () => {
    const { ShellTools } = await import('./shell');
    const tools = new ShellTools();
    const defs = tools.toToolDefinitions();
    expect(defs.length).toBe(3);
    expect(defs[0].name).toBe('execute_command');
    expect(defs[1].name).toBe('run_tests');
    expect(defs[2].name).toBe('install_package');
  });
});
