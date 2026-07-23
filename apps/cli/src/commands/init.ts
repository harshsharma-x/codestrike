import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ProjectConfigSchema } from '@codestrike/core';

export const initCommand = new Command('init')
  .description('Initialize CodeStrike in the current project')
  .option('-y, --yes', 'Accept all defaults')
  .action(async (options) => {
    const cwd = process.cwd();
    const configPath = join(cwd, 'codestrike.json');

    if (existsSync(configPath) && !options.yes) {
      console.log(chalk.yellow('codestrike.json already exists.'));
      return;
    }

    const spinner = ora('Initializing CodeStrike...').start();

    try {
      const config = {
        name: process.cwd().split('/').pop() || 'my-project',
        rootDir: cwd,
        model: process.env.CODESTRIKE_DEFAULT_MODEL || 'mistralai/mixtral-8x7b-instruct',
        provider: process.env.CODESTRIKE_DEFAULT_PROVIDER || 'openrouter',
        ignorePatterns: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '.next/**',
          'coverage/**',
        ],
        temperature: 0.7,
        maxTokens: 4096,
      };

      ProjectConfigSchema.parse(config);
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const forgeDir = join(cwd, '.codestrike');
      if (!existsSync(forgeDir)) {
        mkdirSync(forgeDir, { recursive: true });
      }

      spinner.succeed(chalk.green('CodeStrike initialized!'));
      console.log(chalk.dim(`  Config: ${configPath}`));
      console.log(chalk.dim(`  Run ${chalk.cyan('forge chat')} to start a conversation`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to initialize CodeStrike'));
      console.error(error);
      process.exit(1);
    }
  });
