import { Command } from 'commander';
import chalk from 'chalk';
import readline from 'readline';
import { CommandExecutor } from '@codestrike/terminal';

export const terminalCommand = new Command('terminal')
  .description('Start an integrated terminal')
  .action(async () => {
    const executor = new CommandExecutor();
    const cwd = process.cwd();

    console.log(chalk.bold.cyan('\n  ⚡ CodeStrike Terminal\n'));
    console.log(chalk.dim(`  Working directory: ${cwd}`));
    console.log(chalk.dim('  Type /exit to quit, /danger to toggle dangerous command protection\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green('  $ '),
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        rl.prompt();
        return;
      }

      if (input === '/exit' || input === '/quit') {
        console.log(chalk.dim('  Goodbye!\n'));
        rl.close();
        return;
      }

      if (input === '/danger') {
        executor.setRequireApproval(!executor['requireApproval']);
        console.log(chalk.yellow(`  Dangerous command protection: ${executor['requireApproval'] ? 'ON' : 'OFF'}\n`));
        rl.prompt();
        return;
      }

      executor.on('output', ({ data }) => {
        process.stdout.write(data);
      });

      const result = await executor.execute(input, cwd);

      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);

      if (result.exitCode !== 0) {
        console.log(chalk.red(`\n  Exit code: ${result.exitCode}`));
      }

      rl.prompt();
    });

    rl.on('close', () => process.exit(0));
  });
