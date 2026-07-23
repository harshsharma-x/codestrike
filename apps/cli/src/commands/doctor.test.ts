import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Doctor Command', () => {
  it('should have Node.js version >= 18', () => {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(18);
  });

  it('should export a doctorCommand with correct name', async () => {
    const { doctorCommand } = await import('./doctor');
    expect(doctorCommand.name()).toBe('doctor');
    expect(doctorCommand.description()).toBe('Check system health and configuration');
  });

  it('should log check results when executed', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { doctorCommand } = await import('./doctor');
    await doctorCommand.parseAsync(['node', 'test', 'doctor']);
    expect(consoleLog).toHaveBeenCalled();
    consoleLog.mockRestore();
  });
});
