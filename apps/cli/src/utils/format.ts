import chalk from 'chalk';

export function formatResponse(text: string): string {
  return text
    .split('\n')
    .map(line => {
      if (line.startsWith('```')) return chalk.dim(line);
      if (line.startsWith('#')) return chalk.bold.cyan(line);
      if (line.startsWith('-')) return chalk.dim(line);
      if (line.match(/^\d+\./)) return chalk.dim(line);
      return line;
    })
    .join('\n');
}

export function formatError(text: string): string {
  return chalk.red(`✗ ${text}`);
}

export function formatSuccess(text: string): string {
  return chalk.green(`✓ ${text}`);
}

export function formatWarning(text: string): string {
  return chalk.yellow(`⚠ ${text}`);
}

export function formatCode(text: string, language?: string): string {
  const lang = language ? chalk.dim(` (${language})`) : '';
  return `${chalk.dim('```')}${lang}\n${text}\n${chalk.dim('```')}`;
}
