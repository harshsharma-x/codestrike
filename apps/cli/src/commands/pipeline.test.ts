import { describe, it, expect, vi } from 'vitest';
import { PIPELINE_TEMPLATES } from '@codestrike/shared';

describe('Pipeline Command', () => {
  it('should export a pipelineCommand with correct name', async () => {
    const { pipelineCommand } = await import('./pipeline');
    expect(pipelineCommand.name()).toBe('pipeline');
  });

  it('PIPELINE_TEMPLATES should contain all expected templates', () => {
    const names = Object.keys(PIPELINE_TEMPLATES);
    expect(names).toContain('secure-feature');
    expect(names).toContain('full-review');
    expect(names).toContain('debug-triage');
    expect(names).toContain('docs-gen');
    expect(names).toContain('code-to-deploy');
  });

  it('should accept list subcommand option', async () => {
    const { pipelineCommand } = await import('./pipeline');
    const cmds = pipelineCommand.commands;
    expect(cmds.find((c) => c.name() === 'list')).toBeDefined();
  });

  it('should accept show subcommand option', async () => {
    const { pipelineCommand } = await import('./pipeline');
    const cmds = pipelineCommand.commands;
    expect(cmds.find((c) => c.name() === 'show')).toBeDefined();
  });

  it('should accept run subcommand option', async () => {
    const { pipelineCommand } = await import('./pipeline');
    const cmds = pipelineCommand.commands;
    expect(cmds.find((c) => c.name() === 'run')).toBeDefined();
  });
});
