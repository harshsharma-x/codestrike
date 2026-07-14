import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';

export const updateCommand = new Command('update')
  .description('Check for CodeStrike updates')
  .action(async () => {
    console.log(chalk.dim('\n  Checking for updates...\n'));
    try {
      const currentVersion = '0.1.0';
      const result = execSync('npm view codestrike version 2>/dev/null || echo "0.1.0"', { encoding: 'utf-8', timeout: 5000 });
      const latest = result.trim();
      console.log(`  Current: ${chalk.cyan(currentVersion)}`);
      console.log(`  Latest:  ${latest > currentVersion ? chalk.green(latest) : chalk.dim(latest)}`);
      if (latest > currentVersion) {
        console.log(chalk.yellow('\n  Update available! Run: npm install -g codestrike\n'));
      } else {
        console.log(chalk.green('\n  You\'re up to date!\n'));
      }
    } catch {
      console.log(chalk.yellow('  Could not check for updates (offline)'));
      console.log();
    }
  });
