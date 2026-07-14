import { NextRequest, NextResponse } from 'next/server';
import { ProjectIndexer, semanticSearch } from '@codestrike/rag';

let indexer: ProjectIndexer | null = null;

function getIndexer(): ProjectIndexer {
  if (!indexer) {
    indexer = new ProjectIndexer();
  }
  return indexer;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    const idx = getIndexer();
    const entries = idx.getAllEntries();

    if (entries.length === 0) {
      await idx.indexProject(process.cwd());
    }

    const results = semanticSearch(query, idx.getAllEntries(), 20);

    return NextResponse.json(
      results.map(r => ({
        path: r.entry.path,
        language: r.entry.language,
        score: r.score,
        summary: r.entry.summary,
        matches: r.matches.slice(0, 3),
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed', message: String(error) },
      { status: 500 },
    );
  }
}
