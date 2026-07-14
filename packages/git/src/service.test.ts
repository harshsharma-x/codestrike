import { describe, it, expect, vi } from 'vitest';

vi.mock('execa', () => ({
  execa: vi.fn().mockImplementation((cmd: string, args: string[]) => {
    const fullCmd = `${cmd} ${args.join(' ')}`;
    const outputs: Record<string, string> = {
      'git status --porcelain': ' M src/index.ts\n?? new-file.ts\n',
      'git rev-parse --abbrev-ref HEAD': 'main\n',
      'git rev-parse --short HEAD': 'abc1234\n',
      'git log -1 --pretty=%B': 'feat: add feature\n',
      'git rev-list --count --left-right HEAD...@{upstream}': '3\t2',
      'git diff --no-color': 'diff --git a/src/index.ts b/src/index.ts\n@@ -1,3 +1,4 @@\n+new line\n',
      'git rev-parse --git-dir': '.git\n',
    };
    const result = { stdout: outputs[fullCmd] || '', stderr: '' };
    return Promise.resolve(result);
  }),
}));

import { GitService } from './service';

describe('GitService', () => {
  it('should get git status', async () => {
    const git = new GitService('/test');
    const status = await git.getStatus();
    expect(status.branch).toBe('main');
    expect(status.currentHash).toBe('abc1234');
    expect(status.unstaged).toContain('src/index.ts');
    expect(status.untracked).toContain('new-file.ts');
  });

  it('should get current branch', async () => {
    const git = new GitService('/test');
    const branch = await git.getCurrentBranch();
    expect(branch).toBe('main');
  });

  it('should check if repo', async () => {
    const git = new GitService('/test');
    const isRepo = await git.isRepo();
    expect(isRepo).toBe(true);
  });

  it('should get diff', async () => {
    const git = new GitService('/test');
    const diff = await git.diff();
    expect(diff).toContain('diff --git');
  });
});
