import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';
import { ProjectIndexer } from '@codestrike/rag';
import { GitService } from '@codestrike/git';

export const statusCommand = new Command('status')
  .description('Show project status')
  .action(async () => {
    const cwd = process.cwd();
    console.log(chalk.bold.cyan('\n  CodeStrike Status\n'));

    // Project config
    const configPath = join(cwd, 'codestrike.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      console.log(chalk.dim('  Project:'), chalk.white(config.name));
      console.log(chalk.dim('  Provider:'), chalk.white(config.provider));
      console.log(chalk.dim('  Model:'), chalk.white(config.model));
      console.log();
    } else {
      console.log(chalk.yellow('  No codestrike.json found. Run codestrike init\n'));
    }

    // Git status
    const git = new GitService();
    const isRepo = await git.isRepo();
    if (isRepo) {
      const status = await git.getStatus();
      console.log(chalk.dim(`  Git: ${chalk.cyan(status.branch)}`));
      console.log(chalk.dim(`  Ahead: ${status.ahead}, Behind: ${status.behind}`));
      if (status.staged.length > 0) console.log(chalk.green(`  Staged: ${status.staged.length} files`));
      if (status.unstaged.length > 0) console.log(chalk.yellow(`  Unstaged: ${status.unstaged.length} files`));
      if (status.untracked.length > 0) console.log(chalk.red(`  Untracked: ${status.untracked.length} files`));
      console.log();
    }

    // Index status
    const indexer = new ProjectIndexer();
    await indexer.indexProject(cwd);
    const idxStatus = indexer['status'];
    console.log(chalk.dim(`  Index: ${chalk.cyan(`${idxStatus.files} files`)} across ${chalk.cyan(`${idxStatus.languages} languages`)}`));
    console.log();
  });
