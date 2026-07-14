import { NextRequest, NextResponse } from 'next/server';
import { CommandExecutor } from '@codestrike/terminal';

const executor = new CommandExecutor();

export async function POST(req: NextRequest) {
  try {
    const { command, cwd } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command string is required' }, { status: 400 });
    }

    const result = await executor.execute(command, cwd || process.cwd());

    return NextResponse.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode,
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json({
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || 'Command execution failed',
      exitCode: 1,
    });
  }
}
