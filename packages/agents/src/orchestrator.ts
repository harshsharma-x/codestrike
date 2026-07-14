import { BaseAgent } from './base';
import { PlannerAgent } from './agents/planner';
import { ArchitectAgent } from './agents/architect';
import { CoderAgent } from './agents/coder';
import { ReviewerAgent } from './agents/reviewer';
import { DebuggerAgent } from './agents/debugger';
import { SecurityAgent } from './agents/security';
import { DocumentationAgent } from './agents/documentation';
import { TestingAgent } from './agents/testing';
import { GitAgent } from './agents/git';
import { DeploymentAgent } from './agents/deployment';
import { AIRouter } from '@codestrike/ai';
import { AgentRole, AgentTask } from '@codestrike/shared';
import { Logger } from '@codestrike/core';

export class AgentOrchestrator {
  private agents: Map<AgentRole, BaseAgent> = new Map();
  private logger: Logger;

  constructor(router: AIRouter) {
    this.logger = new Logger('AgentOrchestrator');
    this.registerAgents(router);
  }

  private registerAgents(router: AIRouter): void {
    const agentList: BaseAgent[] = [
      new PlannerAgent(router),
      new ArchitectAgent(router),
      new CoderAgent(router),
      new ReviewerAgent(router),
      new DebuggerAgent(router),
      new SecurityAgent(router),
      new DocumentationAgent(router),
      new TestingAgent(router),
      new GitAgent(router),
      new DeploymentAgent(router),
    ];

    for (const agent of agentList) {
      this.agents.set(agent.role, agent);
    }
  }

  getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async executeTask(task: AgentTask): Promise<AgentTask> {
    const agent = this.agents.get(task.type);
    if (!agent) {
      throw new Error(`No agent registered for role: ${task.type}`);
    }

    this.logger.info(`Dispatching task ${task.id} to ${agent.name}`);
    return agent.execute(task);
  }

  async executePipeline(tasks: AgentTask[]): Promise<AgentTask[]> {
    const results: AgentTask[] = [];

    for (const task of tasks) {
      const agent = this.agents.get(task.type);
      if (!agent) {
        this.logger.error(`No agent for task type: ${task.type}`);
        continue;
      }

      const subtasks = task.subTasks || [];
      if (subtasks.length > 0) {
        const subResults = await this.executePipeline(subtasks);
        task.subTasks = subResults;
      }

      const result = await agent.execute(task);
      results.push(result);

      if (result.status === 'error') {
        this.logger.warn(`Pipeline halted at task ${task.id}: ${result.error}`);
        break;
      }
    }

    return results;
  }

  async executeWithCollaboration(
    primaryRole: AgentRole,
    prompt: string,
    context: string,
    supportingRoles?: AgentRole[],
  ): Promise<{ primary: AgentTask; supporting: AgentTask[] }> {
    const primaryAgent = this.agents.get(primaryRole);
    if (!primaryAgent) {
      throw new Error(`No agent for role: ${primaryRole}`);
    }

    const primaryTask: AgentTask = {
      id: `task-${Date.now()}-primary`,
      agentId: primaryAgent.name,
      type: primaryRole,
      prompt,
      context,
      status: 'pending',
      createdAt: Date.now(),
    };

    const primaryResult = await primaryAgent.execute(primaryTask);
    const supportingResults: AgentTask[] = [];

    if (supportingRoles && primaryResult.status === 'complete') {
      for (const role of supportingRoles) {
        const agent = this.agents.get(role);
        if (!agent) continue;

        const supportingTask: AgentTask = {
          id: `task-${Date.now()}-${role}`,
          agentId: agent.name,
          type: role,
          prompt: `Review and improve the following output from the ${primaryRole} agent:\n\n${primaryResult.result}`,
          context,
          status: 'pending',
          createdAt: Date.now(),
          parentTaskId: primaryTask.id,
        };

        const supportingResult = await agent.execute(supportingTask);
        supportingResults.push(supportingResult);
      }
    }

    return { primary: primaryResult, supporting: supportingResults };
  }
}
