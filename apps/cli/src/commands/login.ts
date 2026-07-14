import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export const loginCommand = new Command('login')
  .description('Configure API keys for AI providers')
  .option('-p, --provider <provider>', 'Specific provider to configure')
  .action(async (options) => {
    console.log(chalk.bold.cyan('\n  CodeStrike Login\n'));
    console.log(chalk.dim('  Configure your AI provider API keys.\n'));

    const providers = options.provider
      ? [{ name: options.provider, value: options.provider }]
      : [
          { name: 'OpenRouter', value: 'openrouter' },
          { name: 'Groq', value: 'groq' },
          { name: 'Hugging Face', value: 'huggingface' },
        ];

    const envFile = join(homedir(), '.codestrike', '.env');
    const envDir = join(homedir(), '.codestrike');

    if (!existsSync(envDir)) {
      mkdirSync(envDir, { recursive: true });
    }

    let existingEnv = '';
    try {
      const { readFileSync } = await import('fs');
      existingEnv = readFileSync(envFile, 'utf-8');
    } catch {
      existingEnv = '';
    }

    for (const provider of providers) {
      const envKey = `${provider.value.toUpperCase()}_API_KEY`;
      const existingMatch = existingEnv.match(new RegExp(`^${envKey}=(.*)$`, 'm'));
      const existing = existingMatch ? existingMatch[1] : '';

      const { apiKey } = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: `${provider.name} API Key${existing ? ' (leave empty to keep existing)' : ''}:`,
          default: existing || '',
        },
      ]);

      if (apiKey) {
        if (existingMatch) {
          existingEnv = existingEnv.replace(new RegExp(`^${envKey}=.*$`, 'm'), `${envKey}=${apiKey}`);
        } else {
          existingEnv += `\n${envKey}=${apiKey}`;
        }
      }
    }

    writeFileSync(envFile, existingEnv.trim() + '\n');
    console.log(chalk.green('\n  ✓ API keys saved to ~/.codestrike/.env\n'));
    console.log(chalk.dim('  Restart your terminal or run: source ~/.codestrike/.env\n'));
  });
