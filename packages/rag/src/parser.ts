import { detectLanguage } from '@codestrike/shared';

export interface ParsedFile {
  path: string;
  content: string;
  language: string;
  summary: string;
  exports: string[];
  imports: string[];
  dependencies: string[];
  size: number;
}

export function parseFile(path: string, content: string): ParsedFile {
  const language = detectLanguage(path);
  return {
    path,
    content,
    language,
    summary: generateSummary(content, language),
    exports: extractExports(content, language),
    imports: extractImports(content, language),
    dependencies: extractDependencies(content, language),
    size: content.length,
  };
}

function generateSummary(content: string, language: string): string {
  const lines = content.split('\n').filter(l => l.trim());
  const firstLines = lines.slice(0, 5).join('; ').slice(0, 200);
  return `File with ${lines.length} lines in ${language}. Contains: ${firstLines}`;
}

function extractExports(content: string, language: string): string[] {
  const exports: string[] = [];
  const patterns: Record<string, RegExp[]> = {
    typescript: [/export\s+(?:function|class|interface|type|const|let|var|enum)\s+(\w+)/g],
    javascript: [/export\s+(?:function|class|const|let|var|default)\s+(\w+)/g, /module\.exports\s*=\s*(\w+)/g],
    python: [/^def\s+(\w+)/gm, /^class\s+(\w+)/gm],
    rust: [/^pub\s+(?:fn|struct|enum|trait|mod|type|const)\s+(\w+)/gm],
    go: [/^func\s+(\w+)/gm, /^type\s+(\w+)/gm],
    java: [/^public\s+(?:class|interface|enum)\s+(\w+)/gm],
  };

  const filePatterns = patterns[language] || [];
  for (const regex of filePatterns) {
    const matches = content.matchAll(regex);
    for (const match of matches) {
      if (match[1]) exports.push(match[1]);
    }
  }

  return [...new Set(exports)];
}

function extractImports(content: string, language: string): string[] {
  const imports: string[] = [];
  const patterns: Record<string, RegExp[]> = {
    typescript: [/import\s+(?:\{[^}]*\}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g, /import\s+['"]([^'"]+)['"]/g],
    javascript: [/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g],
    python: [/^(?:from\s+(\S+)\s+)?import\s+(\S+)/gm],
    rust: [/^use\s+([^;]+)/gm],
    go: [/^import\s+(?:"([^"]+)"|\(([^)]+)\))/gm],
    java: [/^import\s+([^;]+)/gm],
  };

  const filePatterns = patterns[language] || [];
  for (const regex of filePatterns) {
    const matches = content.matchAll(regex);
    for (const match of matches) {
      if (match[1]) imports.push(match[1].trim());
    }
  }

  return [...new Set(imports)];
}

function extractDependencies(content: string, language: string): string[] {
  const deps: string[] = [];
  if (language === 'typescript' || language === 'javascript') {
    const importMatch = content.match(/from\s+['"]([^'"]+)['"]/g);
    if (importMatch) {
      for (const m of importMatch) {
        const pkg = m.replace(/from\s+['"]/, '').replace(/['"]/, '');
        if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
          const parts = pkg.split('/');
          deps.push(parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]);
        }
      }
    }
  }
  if (language === 'python') {
    const importMatch = content.match(/^(?:from|import)\s+(\w+)/gm);
    if (importMatch) {
      for (const m of importMatch) {
        const parts = m.split(/\s+/);
        deps.push(parts[1]);
      }
    }
  }
  return [...new Set(deps)];
}
