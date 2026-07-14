import { NextResponse } from 'next/server';
import { GitService } from '@codestrike/git';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = parseInt(searchParams.get('count') || '10', 10);
    const git = new GitService();
    const log = await git.log(count);
    return NextResponse.json({ log });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get git log', message: String(error) },
      { status: 500 },
    );
  }
}