import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { UserConfigSchema } from '@codestrike/core';

export const configCommand = new Command('config')
  .description('View or modify CodeStrike configuration')
  .option('-g, --global', 'Edit global configuration')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-l, --list', 'List all configuration values')
  .action((options) => {
    const cwd = process.cwd();
    const configPath = join(cwd, 'codestrike.json');

    if (options.list || !options.set) {
      if (!existsSync(configPath)) {
        console.log(chalk.yellow('No codestrike.json found. Run codestrike init first.'));
        return;
      }

      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      console.log(chalk.bold.cyan('\n  Configuration\n'));

      for (const [key, value] of Object.entries(config)) {
        const display = typeof value === 'object' ? JSON.stringify(value) : String(value);
        console.log(chalk.dim(`  ${key}: `) + chalk.white(display));
      }
      console.log();
      return;
    }

    if (options.set) {
      if (!existsSync(configPath)) {
        console.log(chalk.red('No codestrike.json found. Run codestrike init first.'));
        return;
      }

      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      const [key, ...rest] = options.set.split('=');
      const value = rest.join('=');

      if (!key) {
        console.log(chalk.red('Invalid format. Use --set key=value'));
        return;
      }

      try {
        config[key.trim()] = JSON.parse(value);
      } catch {
        config[key.trim()] = value;
      }

      writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green(`  Set ${key.trim()} = ${value}\n`));
    }
  });
