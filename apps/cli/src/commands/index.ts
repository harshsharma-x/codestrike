import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectIndexer } from '@codestrike/rag';

export const indexCommand = new Command('index')
  .description('Index the current project for AI context')
  .option('-r, --reindex', 'Force re-indexing')
  .option('-w, --watch', 'Watch for file changes')
  .action(async (options) => {
    const cwd = process.cwd();
    const spinner = ora('Indexing project...').start();

    try {
      const indexer = new ProjectIndexer();
      const entries = await indexer.indexProject(cwd);

      spinner.succeed(chalk.green(`Indexed ${entries.length} files`));

      const languages = new Set(entries.map(e => e.language));
      console.log(chalk.dim(`  Languages: ${[...languages].join(', ')}`));
      console.log(chalk.dim(`  Total tokens: ${entries.reduce((s, e) => s + e.tokens, 0)}`));
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Indexing failed'));
      console.error(error);
      process.exit(1);
    }
  });
