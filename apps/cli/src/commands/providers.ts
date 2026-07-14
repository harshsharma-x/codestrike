import { Command } from 'commander';
import chalk from 'chalk';
import { PROVIDER_INFO } from '@codestrike/shared';
import { ProviderRegistry } from '@codestrike/ai';

export const providersCommand = new Command('providers')
  .description('List available AI providers')
  .action(async () => {
    console.log(chalk.dim('\n  Available Providers\n'));
    const registry = ProviderRegistry.getInstance();
    const all = registry.getAvailableProviders();
    for (const name of all) {
      const info = PROVIDER_INFO[name];
      if (!info) continue;
      const keySet = !!process.env[info.name.toUpperCase().replace(/\s+/g, '_') + '_API_KEY'] || !!process.env[`${name.toUpperCase()}_API_KEY`];
      const icon = keySet ? chalk.green('✓') : chalk.dim('○');
      const free = info.free ? chalk.green('Free') : chalk.yellow('Paid');
      console.log(`  ${icon} ${chalk.bold(info.name)} — ${free}`);
      console.log(chalk.dim(`     Model: ${info.defaultModel}`));
      console.log(chalk.dim(`     Env: ${info.name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`));
      console.log();
    }
  });
