import { AgentRole, AgentTask } from '@codestrike/shared';
import { AIRouter } from '@codestrike/ai';
import { AICompletionRequest } from '@codestrike/ai';
import { Logger } from '@codestrike/core';

export abstract class BaseAgent {
  public readonly role: AgentRole;
  public readonly name: string;
  protected router: AIRouter;
  protected logger: Logger;

  constructor(role: AgentRole, name: string, router: AIRouter) {
    this.role = role;
    this.name = name;
    this.router = router;
    this.logger = new Logger(`Agent:${name}`);
  }

  abstract get systemPrompt(): string;
  abstract get temperature(): number;
  abstract get maxTokens(): number;

  async execute(task: AgentTask): Promise<AgentTask> {
    const startTime = Date.now();
    this.logger.info(`Executing task: ${task.id}`, { type: task.type });

    try {
      task.status = 'running';

      const request: AICompletionRequest = {
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: task.prompt },
        ],
        model: task.context ? `${task.type}-contextual` : task.type,
        provider: 'openrouter',
        stream: false,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      };

      if (task.context) {
        request.messages.push({
          role: 'user',
          content: `Context:\n${task.context}`,
        });
      }

      const response = await this.router.complete(request);
      task.result = response.content;
      task.status = 'complete';
      task.completedAt = Date.now();

      this.logger.info(`Task complete: ${task.id}`, {
        duration: Date.now() - startTime,
        tokens: response.tokens,
      });

      return task;
    } catch (error) {
      task.status = 'error';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = Date.now();

      this.logger.error(`Task failed: ${task.id}`, { error: task.error });
      return task;
    }
  }

  canHandle(type: AgentRole): boolean {
    return this.role === type;
  }
}
