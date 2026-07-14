'use client';

interface DiffLine {
  type: 'add' | 'del' | 'context';
  content: string;
  lineNumber: number;
}

interface DiffViewerProps {
  diff: string;
}

function parseDiff(diff: string): { file: string; hunks: DiffLine[][] }[] {
  const files: { file: string; hunks: DiffLine[][] }[] = [];
  const fileRegex = /^diff --git a\/(.+?) b\/(.+?)$/gm;
  let fileMatch: RegExpExecArray | null;

  while ((fileMatch = fileRegex.exec(diff)) !== null) {
    const fileName = fileMatch[2];
    const hunks: DiffLine[][] = [];
    const hunkStart = fileMatch.index;
    const nextFileMatch = fileRegex.exec(diff);
    fileRegex.lastIndex = fileMatch.index + 1;

    const hunkContent = diff.slice(hunkStart, nextFileMatch?.index || diff.length);
    const hunkLines = hunkContent.split('\n').filter(l => !l.startsWith('---') && !l.startsWith('+++') && !l.startsWith('diff --git') && !l.startsWith('index '));

    if (hunkLines.length > 0) {
      const lines: DiffLine[] = [];
      let lineNum = 0;
      for (const line of hunkLines) {
        if (line.startsWith('@@')) {
          if (lines.length > 0) hunks.push(lines);
          lines.length = 0;
          const match = line.match(/@@ -\d+,\d+ \+(\d+),\d+ @@/);
          lineNum = match ? parseInt(match[1]) : 0;
          continue;
        }
        if (line.startsWith('+')) {
          lines.push({ type: 'add', content: line.slice(1), lineNumber: lineNum++ });
        } else if (line.startsWith('-')) {
          lines.push({ type: 'del', content: line.slice(1), lineNumber: lineNum });
        } else {
          lines.push({ type: 'context', content: line, lineNumber: lineNum++ });
        }
      }
      if (lines.length > 0) hunks.push(lines);
    }

    files.push({ file: fileName, hunks });
  }

  return files;
}

export default function DiffViewer({ diff }: DiffViewerProps) {
  const files = parseDiff(diff);

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-xs">
        No changes to display
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto font-mono text-xs">
      {files.map((file, fi) => (
        <div key={fi} className="border-b border-[var(--border-primary)]">
          <div className="px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--accent-secondary)] sticky top-0">
            {file.file}
          </div>
          {file.hunks.map((hunk, hi) => (
            <div key={hi}>
              {hunk.map((line, li) => (
                <div
                  key={li}
                  className={`flex px-3 leading-5 ${
                    line.type === 'add' ? 'bg-green-900/30 text-green-400' :
                    line.type === 'del' ? 'bg-red-900/30 text-red-400' :
                    'text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="w-8 text-right text-[var(--text-muted)] mr-3 shrink-0">
                    {line.type === 'del' ? '' : line.lineNumber}
                  </span>
                  <span className="w-5 shrink-0">{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
                  <span className="whitespace-pre-wrap">{line.content}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
