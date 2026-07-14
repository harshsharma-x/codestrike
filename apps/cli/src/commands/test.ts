import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRouter } from '@codestrike/ai';
import { readFileSync, existsSync } from 'fs';

export const testCommand = new Command('test')
  .description('Generate tests for code')
  .argument('<file>', 'File to generate tests for')
  .option('-f, --framework <framework>', 'Test framework (jest, vitest, pytest)', 'vitest')
  .action(async (file, options) => {
    if (!existsSync(file)) {
      console.log(chalk.red(`File not found: ${file}`));
      process.exit(1);
    }

    const content = readFileSync(file, 'utf-8');
    const router = createRouter();

    const spinner = ora(`Generating tests for ${file}...`).start();

    try {
      const response = await router.complete({
        messages: [
          {
            role: 'system',
            content: `You are a testing expert. Generate comprehensive ${options.framework} tests for the given code. Include unit tests, edge cases, and error handling. Output the complete test file.`,
          },
          { role: 'user', content: `Generate tests for this code:\n\n\`\`\`\n${content}\n\`\`\`` },
        ],
        model: 'mistralai/mixtral-8x7b-instruct',
        provider: 'openrouter',
        stream: false,
      });

      spinner.stop();
      console.log(chalk.cyan('\n  Generated Tests:\n'));
      console.log(response.content);
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate tests'));
      console.error(error);
      process.exit(1);
    }
  });
