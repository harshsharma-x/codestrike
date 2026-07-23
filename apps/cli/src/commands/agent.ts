import { Command } from 'commander';
import chalk from 'chalk';
import { createRouter } from '@codestrike/ai';
import { AgentOrchestrator } from '@codestrike/agents';
import { AgentRole } from '@codestrike/shared';
import ora from 'ora';
import { getDefaultProvider } from '../utils';

const VALID_TYPES: AgentRole[] = [
  'planner',
  'architect',
  'coder',
  'reviewer',
  'debugger',
  'security',
  'documentation',
  'testing',
  'git',
  'deployment',
];

export const agentCommand = new Command('agent')
  .description('Run specific AI agents')
  .argument('<type>', `Agent type: ${VALID_TYPES.join(', ')}`)
  .argument('[task]', 'Task description')
  .option('-m, --model <model>', 'AI model to use')
  .option('-p, --provider <provider>', 'AI provider to use')
  .action(async (type, task, options) => {
    if (!task) {
      console.log(chalk.red('\n  Task description required\n'));
      return;
    }

    if (!VALID_TYPES.includes(type as AgentRole)) {
      console.log(
        chalk.red(`\n  Invalid agent type: ${type}\n  Valid types: ${VALID_TYPES.join(', ')}\n`),
      );
      return;
    }

    const spinner = ora({ text: `Running ${type} agent...`, color: 'cyan' }).start();

    try {
      const router = createRouter({
        primaryProvider: (options.provider as any) || getDefaultProvider(),
      });
      const orchestrator = new AgentOrchestrator(router);

      const result = await orchestrator.executeTask({
        id: `cli-${Date.now()}`,
        agentId: type,
        type: type as AgentRole,
        prompt: task,
        context: '',
        status: 'pending',
        createdAt: Date.now(),
      });

      spinner.stop();

      if (result.status === 'error') {
        console.log(chalk.red(`\n  Agent failed: ${result.error}\n`));
        return;
      }

      console.log(chalk.green('\n  Agent Result:\n'));
      console.log(chalk.white(result.result || '(no output)'));
      console.log();
    } catch (error) {
      spinner.stop();
      console.log(
        chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`),
      );
    }
  });
