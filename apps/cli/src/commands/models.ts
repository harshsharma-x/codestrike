import { Command } from 'commander';
import chalk from 'chalk';
import { ProviderRegistry } from '@codestrike/ai';
import { PROVIDER_INFO } from '@codestrike/shared';

export const modelsCommand = new Command('models')
  .description('List available AI models and providers')
  .option('-p, --provider <provider>', 'Filter by provider')
  .action(async (options) => {
    console.log(chalk.bold.cyan('\n  AI Providers & Models\n'));

    const providers = ProviderRegistry.getInstance().getAvailableProviders();

    for (const provider of providers) {
      if (options.provider && provider !== options.provider) continue;

      const info = PROVIDER_INFO[provider];
      const status = info?.free ? chalk.green('✓ Free') : chalk.yellow('$ Paid');

      console.log(chalk.bold(`  ${info?.name || provider}`));
      console.log(chalk.dim(`    Provider: ${provider}`));
      console.log(chalk.dim(`    Status: ${status}`));
      console.log(chalk.dim(`    Default model: ${chalk.cyan(info?.defaultModel || 'N/A')}`));
      console.log(chalk.dim(`    API Key: ${process.env[`${provider.toUpperCase()}_API_KEY`] ? chalk.green('✓ Set') : chalk.red('✗ Not set')}`));
      console.log();
    }
  });
