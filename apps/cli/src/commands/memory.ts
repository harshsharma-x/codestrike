import { Command } from 'commander';
import chalk from 'chalk';

export const memoryCommand = new Command('memory')
  .description('View and manage AI memory')
  .argument('[action]', 'Action: show, clear, preferences, commands', 'show')
  .argument('[key]', 'Memory key')
  .action(async (action, key) => {
    console.log(chalk.dim('\n  Memory\n'));
    try {
      const { MemoryStore } = await import('@codestrike/memory');
      const store = new MemoryStore();
      if (action === 'preferences') {
        const prefs = store.getAllPreferences();
        if (Object.keys(prefs).length === 0) {
          console.log(chalk.yellow('  No saved preferences'));
        } else {
          for (const [k, v] of Object.entries(prefs)) {
            console.log(`  ${chalk.cyan(k)}: ${JSON.stringify(v)}`);
          }
        }
      } else if (action === 'commands') {
        const cmds = store.getRecentCommands(20);
        if (cmds.length === 0) {
          console.log(chalk.yellow('  No recent commands'));
        } else {
          for (const c of cmds) {
            console.log(`  ${chalk.dim(c.timestamp)} ${c.command} ${c.args || ''}`);
          }
        }
      } else if (action === 'clear') {
        if (key) {
          store.setPreference(key, null);
          console.log(chalk.green(`  Cleared ${key}`));
        } else {
          console.log(chalk.yellow('  Specify a key to clear'));
        }
      } else if (action === 'show') {
        if (!key) { console.log(chalk.yellow('  Specify a key to view')); return; }
        const val = store.getPreference(key);
        console.log(`  ${chalk.cyan(key)}: ${val !== undefined ? JSON.stringify(val) : chalk.dim('not set')}`);
      }
      store.close();
    } catch {
      console.log(chalk.yellow('  Memory system unavailable'));
    }
    console.log();
  });
