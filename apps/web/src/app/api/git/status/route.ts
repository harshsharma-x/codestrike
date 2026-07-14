import { NextResponse } from 'next/server';
import { GitService } from '@codestrike/git';

export async function GET() {
  try {
    const git = new GitService();
    const isRepo = await git.isRepo();

    if (!isRepo) {
      return NextResponse.json({ isRepo: false, staged: [], unstaged: [], untracked: [], conflicts: [] });
    }

    const status = await git.getStatus();
    return NextResponse.json({ isRepo: true, ...status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get git status', message: String(error) },
      { status: 500 },
    );
  }
}