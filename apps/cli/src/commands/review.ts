import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRouter } from '@codestrike/ai';
import { AgentOrchestrator } from '@codestrike/agents';
import { readFileSync, existsSync } from 'fs';

export const reviewCommand = new Command('review')
  .description('Review code in the current project')
  .argument('[files...]', 'Files to review')
  .option('-a, --all', 'Review all changed files')
  .action(async (files, options) => {
    const router = createRouter();
    const orchestrator = new AgentOrchestrator(router);

    if (files.length === 0 && !options.all) {
      console.log(chalk.yellow('No files specified. Use forge review <file1> <file2> or forge review --all'));
      return;
    }

    const spinner = ora('Reviewing code...').start();

    try {
      let context = '';

      if (options.all) {
        const { GitService } = await import('@codestrike/git');
        const git = new GitService();
        const changedFiles = await git.getChangedFiles();
        for (const file of changedFiles) {
          if (existsSync(file)) {
            context += `\n## ${file}\n\`\`\`\n${readFileSync(file, 'utf-8')}\n\`\`\`\n`;
          }
        }
      } else {
        for (const file of files) {
          if (!existsSync(file)) {
            console.log(chalk.red(`File not found: ${file}`));
            continue;
          }
          context += `\n## ${file}\n\`\`\`\n${readFileSync(file, 'utf-8')}\n\`\`\`\n`;
        }
      }

      const result = await orchestrator.executeWithCollaboration(
        'reviewer',
        `Review the following code:\n${context}`,
        '',
      );

      spinner.stop();
      console.log(chalk.cyan('\n  Code Review:\n'));
      console.log(result.primary.result);
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Review failed'));
      console.error(error);
      process.exit(1);
    }
  });
