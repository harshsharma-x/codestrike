import { NextResponse } from 'next/server';
import { GitService } from '@codestrike/git';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, files } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
    }

    const git = new GitService();

    if (files && files.length > 0) {
      await git.add(files);
    } else {
      await git.add([]);
    }

    const result = await git.commit(message);
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Commit failed', message: String(error) },
      { status: 500 },
    );
  }
}