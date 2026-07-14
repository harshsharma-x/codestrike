import { IndexEntry } from '@codestrike/shared';

export interface SearchResult {
  entry: IndexEntry;
  score: number;
  matches: string[];
}

export function semanticSearch(
  query: string,
  entries: IndexEntry[],
  maxResults = 10,
): SearchResult[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

  const results: SearchResult[] = entries.map(entry => {
    const matches: string[] = [];
    let score = 0;

    // Path match (highest priority)
    if (entry.path.toLowerCase().includes(queryLower)) {
      score += 100;
      matches.push('path match');
    }

    // Export match
    for (const exp of entry.exports) {
      if (queryTerms.some(t => exp.toLowerCase().includes(t))) {
        score += 50;
        matches.push(`export: ${exp}`);
      }
    }

    // Content match
    const contentLower = entry.content.toLowerCase();
    for (const term of queryTerms) {
      const count = (contentLower.match(new RegExp(term, 'g')) || []).length;
      if (count > 0) {
        score += count * 5;
      }
    }

    // Summary match
    if (entry.summary.toLowerCase().includes(queryLower)) {
      score += 30;
      matches.push('summary match');
    }

    // Dependency match
    for (const dep of entry.dependencies) {
      if (queryTerms.some(t => dep.toLowerCase().includes(t))) {
        score += 20;
        matches.push(`dependency: ${dep}`);
      }
    }

    return { entry, score, matches };
  });

  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export function findRelevantContext(
  query: string,
  entries: IndexEntry[],
  maxTokens = 4000,
): string {
  const results = semanticSearch(query, entries, 20);
  let totalTokens = 0;
  const contextParts: string[] = [];

  for (const result of results) {
    const fileTokens = Math.ceil(result.entry.content.length / 4);
    if (totalTokens + fileTokens > maxTokens) {
      const remainingTokens = maxTokens - totalTokens;
      const truncatedContent = result.entry.content.slice(0, remainingTokens * 4);
      contextParts.push(`// ${result.entry.path} (truncated)\n${truncatedContent}`);
      break;
    }

    contextParts.push(`// ${result.entry.path}\n${result.entry.content}`);
    totalTokens += fileTokens;
  }

  return contextParts.join('\n\n');
}
