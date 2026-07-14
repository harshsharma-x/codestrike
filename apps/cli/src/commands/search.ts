import { Command } from 'commander';
import chalk from 'chalk';
import { ProjectIndexer } from '@codestrike/rag';
import { semanticSearch } from '@codestrike/rag';

export const searchCommand = new Command('search')
  .description('Search indexed project files')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Maximum results', '10')
  .action(async (query, options) => {
    const cwd = process.cwd();
    const indexer = new ProjectIndexer();
    const entries = await indexer.indexProject(cwd);

    const results = semanticSearch(query, entries, parseInt(options.limit));

    if (results.length === 0) {
      console.log(chalk.yellow('\n  No results found\n'));
      return;
    }

    console.log(chalk.bold.cyan(`\n  Search results for "${query}":\n`));

    for (const result of results) {
      const scoreBar = chalk.green('█'.repeat(Math.min(Math.floor(result.score / 10), 20)));
      console.log(chalk.dim(`  ${scoreBar} ${chalk.white(result.score)}`));
      console.log(chalk.cyan(`    ${result.entry.path}`));
      if (result.matches.length > 0) {
        console.log(chalk.dim(`    ${result.matches.slice(0, 3).join(', ')}`));
      }
      console.log();
    }
  });
