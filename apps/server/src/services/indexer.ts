import { ProjectIndexer } from '@codestrike/rag';
import { semanticSearch, findRelevantContext } from '@codestrike/rag';
import { IndexEntry } from '@codestrike/shared';
import { Logger } from '@codestrike/core';

export class ProjectIndexingService {
  private indexers: Map<string, ProjectIndexer> = new Map();
  private logger = new Logger('IndexService');

  async indexProject(rootDir: string, projectId: string): Promise<IndexEntry[]> {
    const indexer = new ProjectIndexer();
    const entries = await indexer.indexProject(rootDir);
    this.indexers.set(projectId, indexer);

    this.logger.info(`Indexed project ${projectId}: ${entries.length} files`);
    return entries;
  }

  async searchProject(projectId: string, query: string, limit = 10) {
    const indexer = this.indexers.get(projectId);
    if (!indexer) {
      throw new Error('Project not indexed. Run indexing first.');
    }

    const entries = indexer.getAllEntries();
    return semanticSearch(query, entries, limit).map(r => ({
      path: r.entry.path,
      language: r.entry.language,
      score: r.score,
      matches: r.matches.slice(0, 3),
      summary: r.entry.summary,
    }));
  }

  getContext(projectId: string, query: string, maxTokens = 4000): string {
    const indexer = this.indexers.get(projectId);
    if (!indexer) return '';

    const entries = indexer.getAllEntries();
    return findRelevantContext(query, entries, maxTokens);
  }

  getStatus(projectId: string) {
    const indexer = this.indexers.get(projectId);
    if (!indexer) return { files: 0, languages: 0, lastIndexed: null };

    return indexer.status;
  }

  getProjectStructure(projectId: string): string {
    const indexer = this.indexers.get(projectId);
    if (!indexer) return '';

    return indexer.getProjectStructure();
  }

  removeProject(projectId: string): void {
    this.indexers.delete(projectId);
  }
}
