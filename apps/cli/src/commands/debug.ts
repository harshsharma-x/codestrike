import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRouter } from '@codestrike/ai';
import { AgentOrchestrator } from '@codestrike/agents';

export const debugCommand = new Command('debug')
  .description('Debug code or errors')
  .argument('[error]', 'Error message or code to debug')
  .option('-f, --file <path>', 'File containing the bug')
  .action(async (error, options) => {
    const router = createRouter();
    const orchestrator = new AgentOrchestrator(router);

    if (!error && !options.file) {
      console.log(chalk.yellow('Provide an error message or file path. Usage: forge debug "error message" or forge debug --file path'));
      return;
    }

    const spinner = ora('Debugging...').start();

    try {
      let context = error || '';

      if (options.file) {
        const { readFileSync, existsSync } = await import('fs');
        if (!existsSync(options.file)) {
          spinner.fail(chalk.red(`File not found: ${options.file}`));
          process.exit(1);
        }
        context += `\n\nFile: ${options.file}\n\`\`\`\n${readFileSync(options.file, 'utf-8')}\n\`\`\``;
      }

      const result = await orchestrator.executeWithCollaboration(
        'debugger',
        `Debug this issue:\n${context}`,
        '',
      );

      spinner.stop();
      console.log(chalk.cyan('\n  Debug Analysis:\n'));
      console.log(result.primary.result);
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Debugging failed'));
      console.error(error);
      process.exit(1);
    }
  });
