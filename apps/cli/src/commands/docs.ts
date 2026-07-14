import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRouter } from '@codestrike/ai';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const docsCommand = new Command('docs')
  .description('Generate documentation')
  .argument('[files...]', 'Files to document')
  .option('-a, --all', 'Document all project files')
  .option('-t, --type <type>', 'Documentation type (api, readme, inline)', 'readme')
  .action(async (files, options) => {
    const router = createRouter();

    let context = '';

    if (options.all) {
      const { glob } = await import('fast-glob');
      const allFiles = await glob('**/*.{ts,tsx,js,jsx,py,rs,go,java}', {
        ignore: ['node_modules/**', 'dist/**', '.git/**'],
      });
      files = allFiles.slice(0, 10);
    }

    if (files.length === 0) {
      if (existsSync('README.md')) {
        context = readFileSync('README.md', 'utf-8');
      }
      if (existsSync('package.json')) {
        context += '\n\n' + readFileSync('package.json', 'utf-8');
      }
    } else {
      for (const file of files) {
        if (existsSync(file)) {
          context += `\n## ${file}\n\`\`\`\n${readFileSync(file, 'utf-8')}\n\`\`\`\n`;
        }
      }
    }

    if (!context) {
      console.log(chalk.yellow('No files found to document'));
      return;
    }

    const spinner = ora('Generating documentation...').start();

    try {
      const typePrompts: Record<string, string> = {
        readme: 'Generate a comprehensive README.md for this project covering: description, installation, usage, API, configuration, and contributing.',
        api: 'Generate API documentation covering all endpoints, parameters, return types, and examples.',
        inline: 'Generate inline code documentation with JSDoc/TSDoc comments for all functions and classes.',
      };

      const response = await router.complete({
        messages: [
          {
            role: 'system',
            content: typePrompts[options.type] || typePrompts.readme,
          },
          { role: 'user', content: `Generate documentation for:\n\n${context.slice(0, 8000)}` },
        ],
        model: 'mistralai/mixtral-8x7b-instruct',
        provider: 'openrouter',
        stream: false,
      });

      spinner.stop();
      console.log(chalk.cyan(`\n  ${options.type.charAt(0).toUpperCase() + options.type.slice(1)} Documentation:\n`));
      console.log(response.content);
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate documentation'));
      console.error(error);
      process.exit(1);
    }
  });
