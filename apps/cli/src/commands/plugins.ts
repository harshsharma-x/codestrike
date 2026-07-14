import { Command } from 'commander';
import chalk from 'chalk';

export const pluginsCommand = new Command('plugins')
  .description('Manage CodeStrike plugins')
  .argument('[action]', 'Action: list, load', 'list')
  .argument('[path]', 'Plugin path or name')
  .action(async (action, pluginPath) => {
    console.log(chalk.dim('\n  Plugins\n'));
    try {
      const { PluginRegistry, PluginLoader } = await import('@codestrike/plugins');
      const registry = new PluginRegistry();
      const loader = new PluginLoader(registry);
      if (action === 'load') {
        if (!pluginPath) { console.log(chalk.red('  Plugin path required')); return; }
        loader.loadFromDirectory(pluginPath);
        console.log(chalk.green(`  Plugins loaded from ${pluginPath}`));
      } else if (action === 'list') {
        loader.loadFromNodeModules();
        const plugins = registry.getAll();
        if (plugins.length === 0) {
          console.log(chalk.yellow('  No plugins loaded'));
        } else {
          for (const p of plugins) {
            console.log(`  ${chalk.cyan(p.manifest.name)} ${chalk.dim(p.manifest.version)}`);
            if (p.manifest.description) console.log(chalk.dim(`     ${p.manifest.description}`));
          }
        }
      }
    } catch {
      console.log(chalk.yellow('  Plugin system unavailable'));
    }
    console.log();
  });
