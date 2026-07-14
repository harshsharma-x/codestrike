import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRouter } from '@codestrike/ai';
import { readFileSync, existsSync } from 'fs';

export const explainCommand = new Command('explain')
  .description('Explain code or concepts')
  .argument('[code]', 'Code snippet or file path to explain')
  .option('-f, --file <path>', 'File to explain')
  .action(async (code, options) => {
    const router = createRouter();
    let content = code || '';

    if (options.file) {
      if (!existsSync(options.file)) {
        console.log(chalk.red(`File not found: ${options.file}`));
        process.exit(1);
      }
      content = readFileSync(options.file, 'utf-8');
    }

    if (!content) {
      console.log(chalk.yellow('No code provided. Use forge explain "your code" or forge explain --file path/to/file'));
      return;
    }

    const spinner = ora('Analyzing code...').start();

    try {
      const response = await router.complete({
        messages: [
          {
            role: 'system',
            content: 'You are an expert programmer. Explain the given code in detail, covering what it does, how it works, and any notable patterns or potential issues.',
          },
          { role: 'user', content: `Explain this code:\n\n${content.slice(0, 8000)}` },
        ],
        model: 'mistralai/mixtral-8x7b-instruct',
        provider: 'openrouter',
        stream: false,
      });

      spinner.stop();
      console.log(chalk.cyan('\n  Explanation:\n'));
      console.log(response.content);
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Failed to explain code'));
      console.error(error);
      process.exit(1);
    }
  });
