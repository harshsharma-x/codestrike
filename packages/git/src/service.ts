import { execa } from 'execa';
import { GitStatus } from '@codestrike/shared';
import { GitError } from '@codestrike/core';

export class GitService {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  private async run(args: string[], options?: Record<string, unknown>): Promise<string> {
    try {
      const { stdout } = await execa('git', args, {
        cwd: this.cwd,
        ...options,
      });
      return stdout;
    } catch (error) {
      throw new GitError(
        `Git command failed: git ${args.join(' ')}`,
        { error: String(error) },
      );
    }
  }

  async getStatus(): Promise<GitStatus> {
    const statusOutput = await this.run(['status', '--porcelain']);
    const branchOutput = await this.run(['rev-parse', '--abbrev-ref', 'HEAD']);
    const hashOutput = await this.run(['rev-parse', '--short', 'HEAD']);
    const lastCommitOutput = await this.run(['log', '-1', '--pretty=%B']);
    const aheadBehind = await this.run(['rev-list', '--count', '--left-right', 'HEAD...@{upstream}']).catch(() => '0\t0');

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];
    const conflicts: string[] = [];

    for (const line of statusOutput.split('\n')) {
      if (!line.trim()) continue;
      const status = line.slice(0, 2);
      const file = line.slice(3).trim();

      if (status.includes('U') || status === 'DD' || status === 'AA') {
        conflicts.push(file);
      } else if (status[0] !== ' ') {
        staged.push(file);
      }
      if (status[1] !== ' ' && status[1] !== '?') {
        unstaged.push(file);
      }
      if (status === '??') {
        untracked.push(file);
      }
    }

    const [ahead, behind] = aheadBehind.split('\t').map(Number);

    return {
      branch: branchOutput.trim(),
      ahead: ahead || 0,
      behind: behind || 0,
      staged,
      unstaged,
      untracked,
      conflicts,
      currentHash: hashOutput.trim(),
      lastCommitMessage: lastCommitOutput.trim().split('\n')[0],
    };
  }

  async add(files: string[] = []): Promise<void> {
    const args = files.length > 0 ? ['add', ...files] : ['add', '.'];
    await this.run(args);
  }

  async commit(message: string): Promise<string> {
    return this.run(['commit', '-m', message]);
  }

  async push(remote = 'origin', branch?: string): Promise<string> {
    const args = ['push', remote];
    if (branch) args.push(branch);
    return this.run(args);
  }

  async pull(remote = 'origin', branch?: string): Promise<string> {
    const args = ['pull', remote];
    if (branch) args.push(branch);
    return this.run(args);
  }

  async checkout(branch: string, create = false): Promise<string> {
    const args = create ? ['checkout', '-b', branch] : ['checkout', branch];
    return this.run(args);
  }

  async branch(): Promise<string[]> {
    const output = await this.run(['branch']);
    return output.split('\n').map(b => b.trim().replace('* ', ''));
  }

  async diff(files: string[] = []): Promise<string> {
    const args = ['diff', '--no-color'];
    if (files.length > 0) args.push('--', ...files);
    return this.run(args);
  }

  async log(count = 10): Promise<string> {
    return this.run(['log', `--max-count=${count}`, '--oneline', '--no-color']);
  }

  async stash(): Promise<string> {
    return this.run(['stash']);
  }

  async stashPop(): Promise<string> {
    return this.run(['stash', 'pop']);
  }

  async hasChanges(): Promise<boolean> {
    const status = await this.run(['status', '--porcelain']);
    return status.trim().length > 0;
  }

  async isRepo(): Promise<boolean> {
    try {
      await this.run(['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    return (await this.run(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  }

  async getFileContent(path: string, ref = 'HEAD'): Promise<string> {
    return this.run(['show', `${ref}:${path}`]);
  }

  async getChangedFiles(ref1 = 'HEAD', ref2 = ''): Promise<string[]> {
    const args = ['diff', '--name-only', ref1];
    if (ref2) args.push(ref2);
    const output = await this.run(args);
    return output.split('\n').filter(Boolean);
  }
}
