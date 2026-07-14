import { Command } from 'commander';
import chalk from 'chalk';
import { CommandExecutor } from '@codestrike/terminal';

export const runCommand = new Command('run')
  .description('Execute a command in the terminal')
  .argument('<command>', 'Command to execute')
  .option('-d, --danger', 'Allow dangerous commands without approval')
  .action(async (command, options) => {
    const executor = new CommandExecutor();

    if (options.danger) {
      executor.setRequireApproval(false);
    }

    console.log(chalk.dim(`\n  Executing: ${chalk.cyan(command)}\n`));

    executor.on('output', ({ data }: { data: string }) => {
      process.stdout.write(data);
    });

    const result = await executor.execute(command);

    if (result.exitCode !== 0) {
      console.log(chalk.red(`\n  Exit code: ${result.exitCode}\n`));
      process.exit(result.exitCode);
    }
  });
