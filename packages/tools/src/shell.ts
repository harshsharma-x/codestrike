import { execSync, spawn } from 'child_process';
import { ToolDefinition, ToolResult } from './types';

const DANGEROUS_COMMANDS = [
  /^rm\s+-rf/, /^rm\s+--recursive/, /^sudo/, /^dd\s/, /^mkfs/, /^fdisk/,
  /^:\(\)\{/, /^chmod\s+777/, /^chown/, /^>\/dev\/sda/, /^wget\s+.*\|/, /^curl\s+.*\|/,
  /^>\/dev\/null/, /^\/dev\/null/, /^shutdown/, /^reboot/, /^init\s+0/, /^init\s+6/,
  /^kill\s+/, /^killall/, /^pkill/, /^systemctl\s+stop/, /^systemctl\s+disable/,
];

export class ShellTools {
  private workingDir: string;
  private confirmDangerous: boolean;

  constructor(workingDir?: string, confirmDangerous = true) {
    this.workingDir = workingDir || process.cwd();
    this.confirmDangerous = confirmDangerous;
  }

  isDangerous(command: string): boolean {
    return DANGEROUS_COMMANDS.some(p => p.test(command.trim()));
  }

  async execute(command: string, timeout = 30000): Promise<ToolResult> {
    try {
      const output = execSync(command, { cwd: this.workingDir, encoding: 'utf-8', timeout, maxBuffer: 10 * 1024 * 1024 });
      return { success: true, data: { stdout: output, stderr: '' } };
    } catch (error: any) {
      return { success: false, data: { stdout: error.stdout || '', stderr: error.stderr || error.message } };
    }
  }

  async runTest(testCommand: string): Promise<ToolResult> {
    return this.execute(testCommand, 120000);
  }

  async installPackage(packageName: string, manager = 'npm'): Promise<ToolResult> {
    return this.execute(`${manager} install ${packageName}`, 60000);
  }

  toToolDefinitions(): ToolDefinition[] {
    const self = this;
    return [
      { name: 'execute_command', description: 'Run a shell command in the project directory', category: 'shell', parameters: { command: { type: 'string', description: 'Command to execute', required: true }, timeout: { type: 'number', description: 'Timeout in ms' } }, execute: (args) => self.execute(args.command as string, (args.timeout as number) || 30000) },
      { name: 'run_tests', description: 'Run tests using the project\'s test command', category: 'shell', parameters: { command: { type: 'string', description: 'Test command to run', required: true } }, execute: (args) => self.runTest(args.command as string) },
      { name: 'install_package', description: 'Install an npm package', category: 'shell', parameters: { package: { type: 'string', description: 'Package name', required: true } }, execute: (args) => self.installPackage(args.package as string) },
    ];
  }
}
