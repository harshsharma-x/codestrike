import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { GitService } from '@codestrike/git';
import { createRouter } from '@codestrike/ai';
import { getDefaultModel, getDefaultProvider } from '../utils';

export const prCommand = new Command('pr')
  .description('Create a GitHub Pull Request')
  .argument('[base]', 'Base branch', 'main')
  .option('-t, --title <title>', 'PR title (skip AI generation)')
  .option('-d, --description <description>', 'PR description (skip AI generation)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(
    async (base: string, options: { title?: string; description?: string; yes?: boolean }) => {
      const git = new GitService();

      try {
        const branch = await git.getCurrentBranch();
        if (branch === base) {
          console.log(
            chalk.yellow(`\n  ⚠ Already on ${base}. Switch to a feature branch first.\n`),
          );
          return;
        }

        console.log(
          chalk.bold(`\n  🔀 Creating PR: ${chalk.cyan(branch)} → ${chalk.cyan(base)}\n`),
        );

        const changedFiles = await git.getChangedFiles(base, branch);
        const diff = await git.diff(changedFiles);

        if (!diff.trim()) {
          console.log(chalk.yellow('\n  ⚠ No diff found between branches. Nothing to PR.\n'));
          return;
        }

        let title = options.title;
        let description = options.description;

        if (!title || !description) {
          process.stdout.write(chalk.dim('  Generating PR description with AI... '));
          try {
            const router = createRouter({ primaryProvider: getDefaultProvider() });
            const model = getDefaultModel();
            const response = await router.complete({
              provider: getDefaultProvider(),
              model,
              messages: [
                {
                  role: 'system' as const,
                  content: 'You generate GitHub PR titles and descriptions. Be concise.',
                },
                {
                  role: 'user' as const,
                  content: `Generate a PR title and description for this diff:\n\n${diff.slice(0, 4000)}`,
                },
              ],
              maxTokens: 500,
              temperature: 0.3,
              stream: false,
            });
            const aiContent = response.content.trim();
            const lines = aiContent.split('\n').filter((l) => l.trim());
            title =
              title ||
              lines[0]
                ?.replace(/^#+\s*/, '')
                .replace(/^Title:\s*/i, '')
                .trim() ||
              `feat: changes on ${branch}`;
            description = description || lines.slice(1).join('\n').trim() || aiContent;
            process.stdout.write(chalk.green('done\n'));
          } catch {
            process.stdout.write(chalk.dim('skipped (AI unavailable)\n'));
            title = title || `Changes on ${branch}`;
            description = description || `Pull request merging ${branch} into ${base}.`;
          }
        }

        console.log(chalk.bold('\n  Title: ') + title);
        console.log(
          chalk.bold('  Description: ') +
            description.slice(0, 200) +
            (description.length > 200 ? '...' : ''),
        );
        console.log();

        if (!options.yes) {
          const inquirer = await import('inquirer');
          const { confirm } = await inquirer.default.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Create this PR?',
              default: true,
            },
          ]);
          if (!confirm) {
            console.log(chalk.dim('  Cancelled.\n'));
            return;
          }
        }

        try {
          execSync('which gh', { stdio: 'pipe' });
        } catch {
          console.log(
            chalk.yellow('  ⚠ GitHub CLI (gh) not found. Install it from https://cli.github.com/'),
          );
          console.log(
            chalk.dim('  To create the PR manually, push your branch and visit GitHub.\n'),
          );
          return;
        }

        const prUrl = execSync(
          `gh pr create --base "${base}" --head "${branch}" --title "${title.replace(/"/g, '\\"')}" --body "${description.replace(/"/g, '\\"')}"`,
          { encoding: 'utf-8' },
        ).trim();
        console.log(chalk.green(`\n  ✓ PR created: ${chalk.underline(prUrl)}\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.log(chalk.red(`\n  ✗ ${msg}\n`));
      }
    },
  );
