import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export const logoutCommand = new Command('logout')
  .description('Remove stored API keys')
  .option('-a, --all', 'Remove all stored keys without prompting')
  .option('-p, --provider <provider>', 'Remove a specific provider key')
  .action(async (options) => {
    const envFile = join(homedir(), '.codestrike', '.env');

    if (!existsSync(envFile)) {
      console.log(chalk.yellow('\n  ⚠ No API keys found. Nothing to remove.\n'));
      return;
    }

    let content = readFileSync(envFile, 'utf-8');
    const lines = content.split('\n').filter((l) => l.includes('_API_KEY='));

    if (lines.length === 0) {
      console.log(chalk.yellow('\n  ⚠ No API keys found. Nothing to remove.\n'));
      return;
    }

    if (options.all) {
      content = content
        .split('\n')
        .filter((l) => !l.includes('_API_KEY='))
        .join('\n');
      writeFileSync(envFile, content.trim() + '\n');
      console.log(chalk.green('\n  ✓ All API keys removed.\n'));
      return;
    }

    if (options.provider) {
      const key = `${options.provider.toUpperCase()}_API_KEY`;
      if (!content.includes(key)) {
        console.log(chalk.yellow(`\n  ⚠ No key found for provider: ${options.provider}\n`));
        return;
      }
      content = content
        .split('\n')
        .filter((l) => !l.startsWith(key))
        .join('\n');
      writeFileSync(envFile, content.trim() + '\n');
      console.log(chalk.green(`\n  ✓ API key removed for ${options.provider}\n`));
      return;
    }

    console.log(chalk.bold('\n  🔑 Stored API Keys\n'));
    for (const line of lines) {
      const [k, v] = line.split('=');
      const masked = v ? v.slice(0, 8) + '…' + v.slice(-4) : '(empty)';
      console.log(`  ${chalk.cyan(k.replace('_API_KEY', ''))}: ${chalk.dim(masked)}`);
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Remove all API keys?',
        default: false,
      },
    ]);

    if (confirm) {
      content = content
        .split('\n')
        .filter((l) => !l.includes('_API_KEY='))
        .join('\n');
      writeFileSync(envFile, content.trim() + '\n');
      console.log(chalk.green('\n  ✓ All API keys removed.\n'));
    } else {
      console.log(chalk.dim('\n  Cancelled.\n'));
    }
  });
