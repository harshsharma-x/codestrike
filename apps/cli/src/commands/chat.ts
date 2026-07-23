import { Command } from 'commander';
import chalk from 'chalk';
import { createRouter } from '@codestrike/ai';
import { ProviderRegistry } from '@codestrike/ai';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AgentOrchestrator } from '@codestrike/agents';
import { ProjectIndexer } from '@codestrike/rag';
import { Logger } from '@codestrike/core';

export const chatCommand = new Command('chat')
  .description('Start an interactive AI chat session')
  .argument('[message]', 'Initial message or question')
  .option('-m, --model <model>', 'AI model to use')
  .option('-p, --provider <provider>', 'AI provider to use')
  .option('--no-index', 'Skip project indexing')
  .action(async (message, options) => {
    const router = createRouter({
      primaryProvider: options.provider as any || 'openrouter',
    });
    const orchestrator = new AgentOrchestrator(router);
    const indexer = new ProjectIndexer();
    const logger = new Logger('CLI');

    console.log(chalk.bold.cyan('\n  ⚡ CodeStrike AI  v0.1.0\n'));
    console.log(chalk.dim('  Type /help for commands, /exit to quit\n'));

    const cwd = process.cwd();
    const configPath = join(cwd, 'codestrike.json');
    let projectContext = '';

    if (existsSync(configPath) && options.index !== false) {
      const spinner = (await import('ora')).default('Indexing project...').start();
      try {
        await indexer.indexProject(cwd);
        spinner.succeed(chalk.green(`Indexed ${indexer['status'].files} files`));
        projectContext = indexer['getProjectStructure']();
      } catch {
        spinner.fail('Indexing failed, continuing without context');
      }
    }

    if (message) {
      console.log(chalk.dim(`\n  You: ${message}\n`));
      const spinner = (await import('ora')).default('Thinking...').start();

      try {
        const response = await router.complete({
          messages: [
            { role: 'system' as const, content: 'You are CodeStrike AI, a helpful coding assistant.' },
            ...(projectContext ? [{ role: 'system' as const, content: `Project structure:\n${projectContext}` }] : []),
            { role: 'user' as const, content: message },
          ],
          model: options.model || 'mistralai/mixtral-8x7b-instruct',
          provider: options.provider as any || 'openrouter',
          stream: false,
        });

        spinner.stop();
        console.log(chalk.cyan('  CodeStrike:'));
        console.log(response.content);
        console.log();
      } catch (error) {
        spinner.fail(chalk.red('Error: ' + (error instanceof Error ? error.message : 'Unknown error')));
      }
      return;
    }

    const readline = (await import('readline')).default;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('  You> '),
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        rl.prompt();
        return;
      }

      if (input === '/exit' || input === '/quit') {
        console.log(chalk.dim('\n  Goodbye!\n'));
        rl.close();
        return;
      }

      if (input === '/help') {
        console.log(chalk.cyan('\n  Commands:'));
        console.log(chalk.dim('  /exit, /quit  - Exit the chat'));
        console.log(chalk.dim('  /help         - Show this help'));
        console.log(chalk.dim('  /clear        - Clear context'));
        console.log(chalk.dim('  /status       - Show project status'));
        console.log(chalk.dim('  /index        - Re-index project'));
        console.log();
        rl.prompt();
        return;
      }

      if (input === '/clear') {
        projectContext = '';
        console.log(chalk.dim('  Context cleared\n'));
        rl.prompt();
        return;
      }

      if (input === '/status') {
        const status = indexer['status'];
        console.log(chalk.cyan('\n  Project Status:'));
        console.log(chalk.dim(`  Files indexed: ${status.files}`));
        console.log(chalk.dim(`  Languages: ${status.languages}`));
        console.log();
        rl.prompt();
        return;
      }

      if (input === '/index') {
        const spinner = (await import('ora')).default('Re-indexing...').start();
        try {
          await indexer.indexProject(cwd);
          spinner.succeed(`Indexed ${indexer['status'].files} files`);
        } catch (e) {
          spinner.fail('Indexing failed');
        }
        rl.prompt();
        return;
      }

      const spinner = (await import('ora')).default('Thinking...').start();

      try {
        const messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; toolCallId?: string }[] = [
          { role: 'system', content: 'You are CodeStrike AI, a helpful coding assistant. Provide clear, concise answers.' },
        ];

        if (projectContext) {
          messages.push({ role: 'system' as const, content: `Current project:\n${projectContext}` });
        }

        messages.push({ role: 'user' as const, content: input });

        const response = await router.complete({
          messages,
          model: options.model || 'mistralai/mixtral-8x7b-instruct',
          provider: options.provider as any || 'openrouter',
          stream: false,
        });

        spinner.stop();
        console.log(chalk.cyan('  CodeStrike:'));
        console.log(response.content);
        console.log();
      } catch (error) {
        spinner.fail(chalk.red('Error: ' + (error instanceof Error ? error.message : 'Unknown error')));
      }

      rl.prompt();
    });

    rl.on('close', () => {
      process.exit(0);
    });
  });
