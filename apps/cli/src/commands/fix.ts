import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRouter } from '@codestrike/ai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getDefaultModel, getDefaultProvider } from '../utils';

export const fixCommand = new Command('fix')
  .description('Fix bugs or issues in code')
  .argument('<file>', 'File to fix')
  .option('-d, --description <desc>', 'Description of the issue')
  .action(async (file, options) => {
    if (!existsSync(file)) {
      console.log(chalk.red(`File not found: ${file}`));
      process.exit(1);
    }

    const content = readFileSync(file, 'utf-8');
    const router = createRouter();

    const spinner = ora(`Analyzing ${file}...`).start();

    try {
      const prompt = options.description
        ? `Fix this issue in the code: ${options.description}\n\nCode:\n\`\`\`\n${content}\n\`\`\``
        : `Review and fix any bugs or issues in this code:\n\n\`\`\`\n${content}\n\`\`\``;

      const response = await router.complete({
        messages: [
          {
            role: 'system',
            content:
              'You are a code fixing assistant. Analyze the code, identify bugs, and provide the fixed version. Output the complete fixed file content.',
          },
          { role: 'user', content: prompt },
        ],
        model: getDefaultModel(),
        provider: getDefaultProvider(),
        stream: false,
      });

      spinner.stop();
      console.log(chalk.cyan('\n  Fix Analysis:\n'));
      console.log(response.content);
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Failed to fix code'));
      console.error(error);
      process.exit(1);
    }
  });
