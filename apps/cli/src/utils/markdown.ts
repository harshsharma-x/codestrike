import chalk from 'chalk';

export function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      out.push(renderCodeBlock(codeLines.join('\n'), lang));
      i++;
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      out.push(renderTable(tableLines));
      continue;
    }

    if (line.startsWith('# ')) {
      out.push(chalk.bold.underline(line.slice(2).trim()));
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      out.push(chalk.bold(line.slice(3).trim()));
      i++;
      continue;
    }
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      out.push(chalk.bold(line.replace(/^#+\s*/, '')));
      i++;
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      out.push(chalk.dim('  • ') + renderInline(line.slice(2)));
      i++;
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        out.push(chalk.dim('  • ') + renderInline(lines[i].slice(2)));
        i++;
      }
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)?.[1] || '';
      out.push(`  ${chalk.dim(num + '.')} ${renderInline(line.replace(/^\d+\.\s/, ''))}`);
      i++;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const n = lines[i].match(/^(\d+)\.\s/)?.[1] || '';
        out.push(`  ${chalk.dim(n + '.')} ${renderInline(lines[i].replace(/^\d+\.\s/, ''))}`);
        i++;
      }
      continue;
    }

    if (line.trim() === '') {
      out.push('');
      i++;
      continue;
    }

    out.push(renderInline(line));
    i++;
  }

  return out.join('\n');
}

function renderInline(text: string): string {
  let result = text;

  result = result.replace(/`([^`]+)`/g, (_, code) => chalk.cyan(code));

  result = result.replace(/\*\*([^*]+)\*\*/g, (_, bold) => chalk.bold(bold));

  result = result.replace(/\*([^*]+)\*/g, (_, italic) => chalk.italic(italic));

  result = result.replace(/~~([^~]+)~~/g, (_, strike) => chalk.strikethrough(strike));

  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, _url) =>
    chalk.blue.underline(label),
  );

  result = result.replace(/^>\s*(.*)/gm, (_, quote) => chalk.dim(chalk.italic(quote)));

  return result;
}

function renderCodeBlock(code: string, language: string): string {
  const langTag = language ? chalk.dim(` ${language} `) : '';
  const line = chalk.dim('━━━') + langTag + chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const codeLines = code.split('\n').map((l) => '  ' + l);
  return `${line}\n${chalk.cyan(codeLines.join('\n'))}\n${chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`;
}

function renderTable(rows: string[]): string {
  const cells = rows.map((r) =>
    r
      .split('|')
      .filter((c) => c.trim())
      .map((c) => c.trim()),
  );
  if (cells.length < 2) return rows.join('\n');

  const colWidths = cells[0].map((_, ci) => Math.max(...cells.map((r) => (r[ci] || '').length)));

  return cells
    .map((row, ri) => {
      if (row.every((c) => /^[-]+$/.test(c))) return '';
      return (
        '  ' +
        row
          .map((c, ci) => {
            const w = colWidths[ci] || c.length;
            return ri === 0 ? chalk.bold(c.padEnd(w)) : c.padEnd(w);
          })
          .join(chalk.dim(' │ '))
      );
    })
    .filter(Boolean)
    .join('\n');
}
