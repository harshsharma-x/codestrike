import { execa, ExecaChildProcess } from 'execa';
import { EventEmitter } from 'events';
import { Logger } from '@codestrike/core';

export const DANGEROUS_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /rm\s+-rf\s+\//, label: 'rm -rf /' },
  { pattern: /mkfs/i, label: 'mkfs filesystem creation' },
  { pattern: /dd\s+if=/, label: 'dd raw disk write' },
  { pattern: /:\(\s*\)\s*\{/, label: 'fork bomb' },
  { pattern: />\s*\/dev\/(sda|sdb|sdc|sdd|xda|nvme)/, label: 'direct disk write' },
  { pattern: /wget\s+.*\s+-O\s+\/tmp\//, label: 'wget to /tmp' },
  { pattern: /(curl|wget)\s+.*\s*\|\s*(sh|bash|zsh)/, label: 'remote pipe to shell' },
  { pattern: /chmod\s+-[Rr]\s+777\s+\//, label: 'chmod -R 777 /' },
  { pattern: /sudo\s+rm/, label: 'sudo rm' },
  { pattern: /shutdown/, label: 'shutdown' },
  { pattern: /reboot/, label: 'reboot' },
  { pattern: /init\s+0/, label: 'init 0' },
  { pattern: /kill\s+-9\s+-1/, label: 'kill -9 -1' },
  { pattern: /(mv|cp|dd)\s+\/dev\/\w+\s/, label: 'device manipulation' },
  { pattern: /passwd/i, label: 'password change' },
];

export function isDangerousCommand(command: string): boolean {
  const normalized = command.trim().toLowerCase();
  return DANGEROUS_PATTERNS.some(dp => dp.pattern.test(normalized));
}

export class CommandExecutor extends EventEmitter {
  private processes: Map<string, ExecaChildProcess> = new Map();
  private logger = new Logger('CommandExecutor');
  private requireApproval = true;

  setRequireApproval(required: boolean): void {
    this.requireApproval = required;
  }

  async execute(
    command: string,
    cwd: string = process.cwd(),
    id?: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const cmdId = id || `cmd-${Date.now()}`;

    if (this.requireApproval && isDangerousCommand(command)) {
      this.emit('dangerousCommand', {
        id: cmdId,
        command,
        cwd,
        message: `This command appears dangerous: ${command}. Type 'yes' to proceed.`,
      });
      return { stdout: '', stderr: 'Command rejected: requires approval', exitCode: 1 };
    }

    this.logger.info(`Executing: ${command} in ${cwd}`);

    try {
      const subprocess = execa(command, {
        cwd,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.processes.set(cmdId, subprocess);
      this.emit('start', { id: cmdId, command });

      let stdout = '';
      let stderr = '';

      if (subprocess.stdout) {
        subprocess.stdout.on('data', (data: Buffer) => {
          const text = data.toString();
          stdout += text;
          this.emit('output', { id: cmdId, type: 'stdout', data: text });
        });
      }

      if (subprocess.stderr) {
        subprocess.stderr.on('data', (data: Buffer) => {
          const text = data.toString();
          stderr += text;
          this.emit('output', { id: cmdId, type: 'stderr', data: text });
        });
      }

      const result = await subprocess;
      this.processes.delete(cmdId);
      this.emit('complete', { id: cmdId, exitCode: result.exitCode });

      return {
        stdout,
        stderr,
        exitCode: result.exitCode || 0,
      };
    } catch (error) {
      this.processes.delete(cmdId);
      const err = error as { stdout?: string; stderr?: string; exitCode?: number };
      this.emit('error', { id: cmdId, error: String(error) });
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || String(error),
        exitCode: err.exitCode || 1,
      };
    }
  }

  cancel(id: string): void {
    const proc = this.processes.get(id);
    if (proc) {
      proc.kill();
      this.processes.delete(id);
      this.emit('cancelled', { id });
    }
  }

  cancelAll(): void {
    for (const [id, proc] of this.processes) {
      proc.kill();
      this.processes.delete(id);
      this.emit('cancelled', { id });
    }
  }

  getActiveProcesses(): string[] {
    return Array.from(this.processes.keys());
  }

  isRunning(id: string): boolean {
    return this.processes.has(id);
  }
}
