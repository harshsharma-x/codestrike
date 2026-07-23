import { readFile } from 'fs/promises';
import { statSync, existsSync } from 'fs';
import { join } from 'path';
import fg from 'fast-glob';
import ignore from 'ignore';
import { IndexEntry, DEFAULT_IGNORE_PATTERNS, MAX_FILE_SIZE } from '@codestrike/shared';
import { parseFile } from './parser';
import { chunkContent } from './chunker';
import { Logger } from '@codestrike/core';

export class ProjectIndexer {
  private logger = new Logger('ProjectIndexer');
  private index: Map<string, IndexEntry> = new Map();
  private projectRoot: string = '';
  private ignoreFilter: ReturnType<typeof ignore>;

  constructor() {
    this.ignoreFilter = ignore().add(DEFAULT_IGNORE_PATTERNS);
  }

  async indexProject(rootDir: string, additionalIgnorePatterns: string[] = []): Promise<IndexEntry[]> {
    this.projectRoot = rootDir;
    this.index.clear();

    if (additionalIgnorePatterns.length > 0) {
      this.ignoreFilter.add(additionalIgnorePatterns);
    }

    const gitignorePath = join(rootDir, '.gitignore');
    if (existsSync(gitignorePath)) {
      try {
        const content = await readFile(gitignorePath, 'utf-8');
        this.ignoreFilter.add(content);
      } catch {
        // ignore .gitignore read errors
      }
    }

    this.logger.info(`Indexing project: ${rootDir}`);

    const files = await fg('**/*', {
      cwd: rootDir,
      dot: false,
      absolute: false,
      onlyFiles: true,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**', 'coverage/**'],
    });

    const entries: IndexEntry[] = [];
    let indexed = 0;
    let skipped = 0;

    for (const file of files) {
      if (this.ignoreFilter.ignores(file)) {
        skipped++;
        continue;
      }

      const absolutePath = join(rootDir, file);
      try {
        const stats = statSync(absolutePath);
        if (stats.size > MAX_FILE_SIZE) {
          skipped++;
          continue;
        }

        const content = await readFile(absolutePath, 'utf-8');
        const parsed = parseFile(file, content);
        const chunks = chunkContent(content, file);

        const entry: IndexEntry = {
          id: file.replace(/[/\\]/g, '-'),
          path: file,
          content,
          summary: parsed.summary,
          language: parsed.language,
          tokens: chunks.reduce((sum, c) => sum + c.tokens, 0),
          embeddings: [],
          lastIndexed: Date.now(),
          dependencies: parsed.dependencies,
          exports: parsed.exports,
          imports: parsed.imports,
        };

        this.index.set(file, entry);
        entries.push(entry);
        indexed++;
      } catch {
        skipped++;
      }
    }

    this.logger.info(`Indexed ${indexed} files, skipped ${skipped}`);
    return entries;
  }

  getEntry(path: string): IndexEntry | undefined {
    return this.index.get(path);
  }

  getAllEntries(): IndexEntry[] {
    return Array.from(this.index.values());
  }

  getFilesByLanguage(language: string): IndexEntry[] {
    return this.getAllEntries().filter(e => e.language === language);
  }

  getFilesByDependency(dep: string): IndexEntry[] {
    return this.getAllEntries().filter(e => e.dependencies.includes(dep));
  }

  getProjectStructure(): string {
    const tree: string[] = [];
    const entries = this.getAllEntries();

    const addToTree = (path: string, level: number) => {
      const parts = path.split('/');
      if (parts.length <= level) return;
      const name = parts[level];
      const prefix = '  '.repeat(level) + (level > 0 ? '├── ' : '');
      if (!tree.includes(`${prefix}${name}/`) && !tree.includes(`${prefix}${name}`)) {
        tree.push(`${prefix}${name}${parts.length > level + 1 ? '/' : ''}`);
      }
    };

    for (const entry of entries) {
      const parts = entry.path.split('/');
      for (let i = 0; i < parts.length; i++) {
        addToTree(entry.path, i);
      }
    }

    return tree.join('\n');
  }

  search(query: string): IndexEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllEntries().filter(
      entry =>
        entry.path.toLowerCase().includes(lowerQuery) ||
        entry.content.toLowerCase().includes(lowerQuery) ||
        entry.summary.toLowerCase().includes(lowerQuery),
    );
  }

  clear(): void {
    this.index.clear();
  }

  get status(): { files: number; languages: number; lastIndexed: number | null } {
    const entries = this.getAllEntries();
    const languages = new Set(entries.map(e => e.language));
    const timestamps = entries.map(e => e.lastIndexed).filter(t => t > 0);
    return {
      files: entries.length,
      languages: languages.size,
      lastIndexed: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }
}
