import { MAX_CHUNK_SIZE } from '@codestrike/shared';

export interface Chunk {
  id: string;
  content: string;
  index: number;
  startLine: number;
  endLine: number;
  tokens: number;
}

export function chunkContent(content: string, path: string, maxSize = MAX_CHUNK_SIZE): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentStart = 0;
  let chunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (currentChunk.length + line.length + 1 > maxSize && currentChunk.length > 0) {
      chunks.push({
        id: `${path}:${chunkIndex}`,
        content: currentChunk.trim(),
        index: chunkIndex,
        startLine: currentStart,
        endLine: i - 1,
        tokens: estimateTokens(currentChunk),
      });
      currentChunk = '';
      currentStart = i;
      chunkIndex++;
    }
    currentChunk += line + '\n';
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${path}:${chunkIndex}`,
      content: currentChunk.trim(),
      index: chunkIndex,
      startLine: currentStart,
      endLine: lines.length - 1,
      tokens: estimateTokens(currentChunk),
    });
  }

  return chunks;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function mergeChunks(chunks: Chunk[], maxTokens: number): Chunk[] {
  const merged: Chunk[] = [];
  let current: Chunk | null = null;

  for (const chunk of chunks) {
    if (!current) {
      current = chunk;
    } else if (current.tokens + chunk.tokens <= maxTokens) {
      current = {
        id: current.id,
        content: current.content + '\n' + chunk.content,
        index: current.index,
        startLine: current.startLine,
        endLine: chunk.endLine,
        tokens: current.tokens + chunk.tokens,
      };
    } else {
      merged.push(current);
      current = chunk;
    }
  }

  if (current) merged.push(current);
  return merged;
}
