import { Command } from 'commander';
import chalk from 'chalk';
import { PIPELINE_TEMPLATES, PipelineTemplate } from '@codestrike/shared';
import { AgentOrchestrator, PipelineRunner } from '@codestrike/agents';
import { createRouter } from '@codestrike/ai';
import { getDefaultProvider } from '../utils';

const pipelineCmd = new Command('pipeline').description('Run and manage AI agent pipelines');

pipelineCmd
  .command('list')
  .description('List available pipeline templates')
  .action(() => {
    console.log(chalk.bold('\n  📋 Pipeline Templates\n'));
    for (const [key, template] of Object.entries(PIPELINE_TEMPLATES)) {
      const steps = template.steps.map((s) => chalk.cyan(s.agentRole)).join(' → ');
      console.log(`  ${chalk.bold(key)}`);
      console.log(chalk.dim(`    ${template.description}`));
      console.log(`    ${steps}`);
      console.log();
    }
  });

pipelineCmd
  .command('show')
  .description('Show details of a pipeline template')
  .argument('<name>', 'Pipeline template name')
  .action((name: string) => {
    const template = PIPELINE_TEMPLATES[name];
    if (!template) {
      console.error(chalk.red(`Unknown pipeline: ${name}`));
      console.log(chalk.dim(`Available: ${Object.keys(PIPELINE_TEMPLATES).join(', ')}`));
      return;
    }
    console.log(chalk.bold(`\n  📋 ${template.name}`));
    console.log(chalk.dim(`  ${template.description}\n`));
    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i];
      const deps = step.dependsOn?.length
        ? chalk.dim(` (after: ${step.dependsOn.join(', ')})`)
        : '';
      console.log(`  ${chalk.cyan(`Step ${i + 1}: ${step.agentRole}`)}${deps}`);
      console.log(
        chalk.dim(
          `    ${step.prompt.replace('{{task}}', '<task>').replace('{{previous}}', '<previous output>')}`,
        ),
      );
      console.log();
    }
  });

pipelineCmd
  .command('run')
  .description('Run a pipeline template')
  .argument('<template>', 'Pipeline template name')
  .argument('<task>', 'Task description for the pipeline')
  .option('-m, --model <model>', 'Model to use')
  .option('-p, --provider <provider>', 'Provider to use')
  .action(
    async (template: string, task: string, options: { model?: string; provider?: string }) => {
      const tpl = PIPELINE_TEMPLATES[template];
      if (!tpl) {
        console.error(chalk.red(`Unknown pipeline: ${template}`));
        console.log(chalk.dim(`Available: ${Object.keys(PIPELINE_TEMPLATES).join(', ')}`));
        return;
      }

      console.log(chalk.bold(`\n  🚀 Running Pipeline: ${chalk.cyan(tpl.name)}`));
      console.log(chalk.dim(`  ${tpl.description}`));
      console.log(chalk.dim(`  Task: ${task}\n`));

      const router = createRouter({
        primaryProvider: (options.provider as any) || getDefaultProvider(),
      });

      const orchestrator = new AgentOrchestrator(router);
      const runner = new PipelineRunner(orchestrator);
      const pipeline = runner.fromTemplate(template, task);

      for (let i = 0; i < pipeline.steps.length; i++) {
        const step = pipeline.steps[i];
        console.log(
          `  ${chalk.cyan(`[${i + 1}/${pipeline.steps.length}]`)} Running ${chalk.bold(step.agentRole)}...`,
        );
      }

      console.log();
      const result = await runner.runPipeline(pipeline, task);

      for (const stepResult of result.steps) {
        const icon = stepResult.status === 'complete' ? chalk.green('✓') : chalk.red('✗');
        const dur =
          stepResult.completedAt && stepResult.createdAt
            ? ` (${stepResult.completedAt - stepResult.createdAt}ms)`
            : '';
        console.log(`  ${icon} ${chalk.bold(stepResult.agentId)}${chalk.dim(dur)}`);

        if (stepResult.error) {
          console.log(chalk.red(`    Error: ${stepResult.error}`));
        } else if (stepResult.result) {
          const preview = stepResult.result.slice(0, 200);
          console.log(chalk.dim(`    ${preview}${stepResult.result.length > 200 ? '...' : ''}`));
        }
        console.log();
      }

      const completed = result.steps.filter((s) => s.status === 'complete').length;
      const failed = result.steps.filter((s) => s.status === 'error').length;
      console.log(chalk.dim(`  ${completed} steps completed${failed ? `, ${failed} failed` : ''}`));
      console.log();
    },
  );

export const pipelineCommand = pipelineCmd;
