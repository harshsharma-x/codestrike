import { NextResponse } from 'next/server';
import { ProjectIndexer } from '@codestrike/rag';

let indexer: ProjectIndexer | null = null;

function getIndexer(): ProjectIndexer {
  if (!indexer) {
    indexer = new ProjectIndexer();
  }
  return indexer;
}

export async function GET() {
  try {
    const idx = getIndexer();
    const entries = idx.getAllEntries();

    if (entries.length === 0) {
      const cwd = process.cwd();
      await idx.indexProject(cwd);
    }

    const tree = idx.getProjectStructure();
    return NextResponse.json({ tree });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get project structure', message: String(error) },
      { status: 500 },
    );
  }
}