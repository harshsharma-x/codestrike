import { AgentOrchestrator } from './orchestrator';
import {
  Pipeline,
  PipelineStep,
  PipelineTemplate,
  PIPELINE_TEMPLATES,
  AgentTask,
} from '@codestrike/shared';
import { Logger } from '@codestrike/core';

export class PipelineRunner {
  private orchestrator: AgentOrchestrator;
  private logger: Logger;

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
    this.logger = new Logger('PipelineRunner');
  }

  getTemplates(): Record<string, PipelineTemplate> {
    return PIPELINE_TEMPLATES;
  }

  getTemplate(name: string): PipelineTemplate | undefined {
    return PIPELINE_TEMPLATES[name];
  }

  async runPipeline(
    pipeline: Pipeline,
    taskInput: string,
  ): Promise<{ steps: AgentTask[]; results: Record<string, string> }> {
    const results: Record<string, string> = {};
    const stepResults: AgentTask[] = [];

    for (const step of pipeline.steps) {
      this.logger.info(`Running pipeline step: ${step.id} (${step.agentRole})`);

      let resolvedPrompt = step.prompt.replace('{{task}}', taskInput);
      if (step.dependsOn && step.dependsOn.length > 0) {
        for (const depId of step.dependsOn) {
          const depResult = results[depId];
          if (depResult) {
            resolvedPrompt = resolvedPrompt.replace('{{previous}}', depResult);
          }
        }
      }

      const agentTask: AgentTask = {
        id: step.id,
        agentId: step.agentRole,
        type: step.agentRole,
        prompt: resolvedPrompt,
        context: step.context || '',
        status: 'pending',
        createdAt: Date.now(),
      };

      const result = await this.orchestrator.executeTask(agentTask);
      stepResults.push(result);

      if (result.status === 'error') {
        this.logger.error(`Pipeline halted at step ${step.id}: ${result.error}`);
        break;
      }

      results[step.id] = result.result || '';
    }

    return { steps: stepResults, results };
  }

  fromTemplate(templateName: string, taskInput: string): Pipeline {
    const template = PIPELINE_TEMPLATES[templateName];
    if (!template) throw new Error(`Unknown pipeline template: ${templateName}`);

    const steps: PipelineStep[] = template.steps.map((s, i) => ({
      id: `step-${i}`,
      agentRole: s.agentRole,
      prompt: s.prompt.replace('{{task}}', taskInput),
      dependsOn: s.dependsOn,
    }));

    return {
      id: `pipeline-${Date.now()}`,
      name: template.name,
      description: template.description,
      steps,
      createdAt: Date.now(),
    };
  }
}
