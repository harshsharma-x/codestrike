import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRouter } from '@codestrike/ai';
import { GitService } from '@codestrike/git';
import { getDefaultModel, getDefaultProvider } from '../utils';

export const commitCommand = new Command('commit')
  .description('Generate a commit message for staged changes')
  .option('-m, --message <message>', 'Commit message (skip AI generation)')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (options) => {
    const git = new GitService();
    const isRepo = await git.isRepo();

    if (!isRepo) {
      console.log(chalk.red('Not a git repository'));
      process.exit(1);
    }

    if (options.message) {
      await git.add();
      const result = await git.commit(options.message);
      console.log(chalk.green(result));
      return;
    }

    const hasChanges = await git.hasChanges();
    if (!hasChanges) {
      console.log(chalk.yellow('No changes to commit'));
      return;
    }

    const status = await git.getStatus();
    const diff = await git.diff();

    const spinner = ora('Generating commit message...').start();

    try {
      const router = createRouter();
      const response = await router.complete({
        messages: [
          {
            role: 'system',
            content:
              'You are a git commit message generator. Generate a conventional commit message based on the diff. Format: type(scope): description\n\nTypes: feat, fix, docs, style, refactor, test, chore',
          },
          {
            role: 'user',
            content: `Generate a commit message for this diff:\n\n${diff.slice(0, 4000)}`,
          },
        ],
        model: getDefaultModel(),
        provider: getDefaultProvider(),
        stream: false,
      });

      spinner.stop();

      const message = response.content.trim().split('\n')[0];
      console.log(chalk.cyan('\n  Suggested commit message:'));
      console.log(chalk.white(`  ${message}`));
      console.log();

      if (!options.yes) {
        const inquirer = await import('inquirer');
        const { confirm } = await inquirer.default.prompt([
          { type: 'confirm', name: 'confirm', message: 'Commit with this message?', default: true },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Commit cancelled'));
          return;
        }
      }

      await git.add();
      const result = await git.commit(message);
      console.log(chalk.green(result));
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate commit message'));
      console.error(error);
      process.exit(1);
    }
  });
