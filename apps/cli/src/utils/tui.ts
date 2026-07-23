import chalk from 'chalk';
import { renderMarkdown } from './markdown';

const ESC = '\x1b';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class TUI {
  private rows: number;
  private cols: number;
  private messages: Message[] = [];
  private scrollOffset = 0;
  private inputBuffer = '';
  private cursorPos = 0;
  private history: string[] = [];
  private historyIndex = -1;
  private statusText = '';
  private modelName = '';
  private providerName = '';
  private sessionId = '';
  private msgCount = 0;
  private tabCompletions: string[] = [];
  private tabIndex = -1;
  private tabPrefix = '';
  private busy = false;
  private inputResolve?: (value: string) => void;
  private altScreen = false;
  private rawMode = false;
  private destroyed = false;
  private escapeSeq = '';

  private readonly headerH = 2;
  private readonly footerH = 2;
  get messageTop(): number {
    return this.headerH + 1;
  }
  get messageBottom(): number {
    return this.rows - this.footerH - 1;
  }
  get messageHeight(): number {
    return Math.max(1, this.messageBottom - this.messageTop + 1);
  }
  get contentWidth(): number {
    return Math.max(20, this.cols - 6);
  }

  constructor() {
    this.rows = process.stdout.rows || 24;
    this.cols = process.stdout.columns || 80;
  }

  init(): void {
    if (this.destroyed) return;
    this.rows = process.stdout.rows || 24;
    this.cols = process.stdout.columns || 80;
    if (!this.altScreen) {
      process.stdout.write(ESC + '[?1049h');
      this.altScreen = true;
    }
    process.stdout.write(ESC + '[?25l' + ESC + '[2J' + ESC + '[H');
    if (!this.rawMode) {
      process.stdin.setRawMode?.(true);
      this.rawMode = true;
    }
    process.stdin.resume();
    process.stdin.removeAllListeners('data');
    process.stdin.on('data', (data: Buffer) => {
      if (!this.destroyed) this.parseInput(data);
    });
    process.stdout.on('resize', () => {
      this.rows = process.stdout.rows || 24;
      this.cols = process.stdout.columns || 80;
      if (!this.destroyed) this.render();
    });
    this.render();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    process.stdout.write(ESC + '[?25h');
    if (this.altScreen) {
      process.stdout.write(ESC + '[?1049l');
      this.altScreen = false;
    }
    if (this.rawMode) {
      process.stdin.setRawMode?.(false);
      this.rawMode = false;
    }
    process.stdin.pause();
  }

  suspend(): void {
    process.stdout.write(ESC + '[?25h');
    if (this.altScreen) {
      process.stdout.write(ESC + '[?1049l');
      this.altScreen = false;
    }
    if (this.rawMode) {
      process.stdin.setRawMode?.(false);
      this.rawMode = false;
    }
  }

  resume(): void {
    this.destroyed = false;
    this.rows = process.stdout.rows || 24;
    this.cols = process.stdout.columns || 80;
    if (!this.altScreen) {
      process.stdout.write(ESC + '[?1049h');
      this.altScreen = true;
    }
    process.stdout.write(ESC + '[?25l' + ESC + '[2J' + ESC + '[H');
    if (!this.rawMode) {
      process.stdin.setRawMode?.(true);
      this.rawMode = true;
    }
    process.stdin.resume();
    this.render();
  }

  setBusy(b: boolean): void {
    this.busy = b;
  }
  setCommands(cmds: string[]): void {
    this.tabCompletions = cmds.sort();
  }
  setModel(n: string): void {
    this.modelName = n;
    this.render();
  }
  setProvider(n: string): void {
    this.providerName = n;
    this.render();
  }
  setSessionId(id: string): void {
    this.sessionId = id;
    this.render();
  }
  setStatus(s: string): void {
    this.statusText = s;
    this.render();
  }

  addMessage(msg: Message): void {
    this.messages.push(msg);
    this.msgCount = this.messages.length;
    this.scrollOffset = 0;
    this.render();
  }

  appendToLast(text: string): void {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'assistant') {
        this.messages[i].content += text;
        this.render();
        return;
      }
    }
    this.addMessage({ role: 'assistant', content: text });
  }

  clearMessages(): void {
    this.messages = [];
    this.msgCount = 0;
    this.scrollOffset = 0;
    this.render();
  }

  getMessages(): Message[] {
    return this.messages;
  }

  async ask(prompt?: string): Promise<string> {
    if (prompt) this.statusText = prompt;
    this.render();
    return new Promise<string>((resolve) => {
      this.inputResolve = resolve;
    });
  }

  private submit(): void {
    const line = this.inputBuffer;
    this.inputBuffer = '';
    this.cursorPos = 0;
    this.tabIndex = -1;
    if (line.trim()) {
      this.history.push(line);
      this.historyIndex = this.history.length;
    }
    this.render();
    const resolve = this.inputResolve;
    this.inputResolve = undefined;
    resolve?.(line);
  }

  private parseInput(data: Buffer): void {
    let i = 0;
    while (i < data.length) {
      const b = data[i];
      if (b === 0x1b) {
        this.escapeSeq = '\x1b';
        i++;
        continue;
      }
      if (this.escapeSeq === '\x1b' && b === 0x5b) {
        this.escapeSeq = '\x1b[';
        i++;
        continue;
      }
      if (this.escapeSeq === '\x1b[' && b >= 0x41 && b <= 0x44) {
        const dir = String.fromCharCode(b);
        this.escapeSeq = '';
        if (!this.busy && this.inputResolve) {
          if (dir === 'A') this.arrowUp();
          else if (dir === 'B') this.arrowDown();
          else if (dir === 'C') this.arrowRight();
          else if (dir === 'D') this.arrowLeft();
        }
        i++;
        continue;
      }
      if (this.escapeSeq === '\x1b[' && b >= 0x31 && b <= 0x36) {
        const code = String.fromCharCode(b);
        i++;
        if (i < data.length && data[i] === 0x7e) {
          this.escapeSeq = '';
          if (code === '5') {
            this.scrollUp();
          } else if (code === '6') {
            this.scrollDown();
          }
          i++;
        }
        continue;
      }
      if (this.escapeSeq === '\x1b[' && b === 0x48) {
        this.escapeSeq = '';
        i++;
        continue;
      }
      if (this.escapeSeq === '\x1b[' && b === 0x46) {
        this.escapeSeq = '';
        i++;
        continue;
      }
      if (this.escapeSeq) {
        this.escapeSeq = '';
        i++;
        continue;
      }

      const ch = String.fromCharCode(b);
      if (ch === '\r') {
        if (!this.busy && this.inputResolve) this.submit();
        i++;
        continue;
      }
      if (ch === '\x7f') {
        if (!this.busy && this.inputResolve) this.backspace();
        i++;
        continue;
      }
      if (ch === '\x03') {
        if (this.inputResolve) {
          this.inputResolve('/exit');
          this.inputResolve = undefined;
        }
        i++;
        continue;
      }
      if (ch === '\t') {
        if (!this.busy && this.inputResolve) this.handleTab();
        i++;
        continue;
      }
      if (ch === '\n') {
        i++;
        continue;
      }
      if (b < 0x20) {
        i++;
        continue;
      }

      if (!this.busy && this.inputResolve) {
        this.inputBuffer =
          this.inputBuffer.slice(0, this.cursorPos) + ch + this.inputBuffer.slice(this.cursorPos);
        this.cursorPos++;
        this.tabIndex = -1;
        this.render();
      }
      i++;
    }
  }

  private backspace(): void {
    if (this.cursorPos > 0) {
      this.inputBuffer =
        this.inputBuffer.slice(0, this.cursorPos - 1) + this.inputBuffer.slice(this.cursorPos);
      this.cursorPos--;
      this.tabIndex = -1;
      this.render();
    }
  }

  private arrowUp(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.inputBuffer = this.history[this.historyIndex];
      this.cursorPos = this.inputBuffer.length;
      this.tabIndex = -1;
      this.render();
    }
  }

  private arrowDown(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.inputBuffer = this.history[this.historyIndex];
      this.cursorPos = this.inputBuffer.length;
    } else {
      this.historyIndex = this.history.length;
      this.inputBuffer = '';
      this.cursorPos = 0;
    }
    this.tabIndex = -1;
    this.render();
  }

  private arrowRight(): void {
    if (this.cursorPos < this.inputBuffer.length) {
      this.cursorPos++;
      this.render();
    }
  }
  private arrowLeft(): void {
    if (this.cursorPos > 0) {
      this.cursorPos--;
      this.render();
    }
  }
  private scrollUp(): void {
    const max = Math.max(0, this.totalLines() - this.messageHeight);
    if (this.scrollOffset < max) {
      this.scrollOffset++;
      this.render();
    }
  }
  private scrollDown(): void {
    if (this.scrollOffset > 0) {
      this.scrollOffset--;
      this.render();
    }
  }

  private handleTab(): void {
    const parts = this.inputBuffer.split(/\s+/);
    const current = parts[parts.length - 1];
    if (!current.startsWith('/')) {
      this.statusText = '';
      this.render();
      return;
    }

    if (this.tabIndex < 0) {
      this.tabPrefix = current;
      this.tabIndex = 0;
    } else {
      this.tabIndex++;
    }

    const matches = this.tabCompletions.filter((c) => c.startsWith(this.tabPrefix));
    if (matches.length === 0) {
      this.tabIndex = -1;
      this.statusText = '';
      this.render();
      return;
    }
    if (this.tabIndex >= matches.length) this.tabIndex = 0;

    parts[parts.length - 1] = matches[this.tabIndex];
    this.inputBuffer = parts.join(' ');
    this.cursorPos = this.inputBuffer.length;
    this.statusText = `[${this.tabIndex + 1}/${matches.length}] ${matches.join(', ')}`;
    this.render();
  }

  private totalLines(): number {
    let t = 0;
    for (const m of this.messages) t += this.msgLines(m).length;
    return t;
  }

  private msgLines(msg: Message): string[] {
    const prefix =
      msg.role === 'user'
        ? chalk.cyan('  You>')
        : msg.role === 'assistant'
          ? chalk.cyan('  CodeStrike:')
          : chalk.dim('  ●');
    const raw = renderMarkdown(msg.content);
    const wrapped = wrapAnsi(raw, this.contentWidth);
    const lines: string[] = [];
    for (let i = 0; i < wrapped.length; i++) {
      lines.push(i === 0 ? `${prefix} ${wrapped[i]}` : `  ${wrapped[i]}`);
    }
    if (lines.length === 0) lines.push(prefix);
    lines.push('');
    return lines;
  }

  render(): void {
    if (this.destroyed) return;
    const out: string[] = [];
    out.push(this.renderHeader());
    out.push(this.renderInfo());
    out.push(this.renderDiv());

    const areaH = this.messageHeight;
    const msgLines: string[] = [];
    let skip = this.scrollOffset;
    let shown = 0;
    for (const m of this.messages) {
      const ml = this.msgLines(m);
      for (const l of ml) {
        if (skip > 0) {
          skip--;
          continue;
        }
        if (shown >= areaH) break;
        msgLines.push(l);
        shown++;
      }
      if (shown >= areaH) break;
    }
    for (const l of msgLines) out.push(l);
    for (let i = msgLines.length; i < areaH; i++) out.push('');

    out.push(this.renderDiv());
    out.push(this.renderStatus());
    out.push(this.renderInput());

    process.stdout.write(ESC + '[H' + out.join('\n'));
    const inputRow = this.rows;
    const promptLen = 6; // '  You> '
    const displayCursor = Math.min(promptLen + this.cursorPos, this.cols);
    process.stdout.write(ESC + `[${inputRow};${displayCursor}H`);
  }

  private renderHeader(): string {
    const L = chalk.bold.cyan('  ⚡ CodeStrike AI  v0.1.0');
    const R = chalk.dim(`session: ${(this.sessionId || 'new').slice(0, 8)}`);
    return L + spaces(this.cols - strip(L).length - strip(R).length) + R;
  }

  private renderInfo(): string {
    const L = chalk.dim(`  model: ${chalk.white(this.modelName)}`);
    const R = chalk.dim(`provider: ${chalk.white(this.providerName)}`);
    return L + spaces(this.cols - strip(L).length - strip(R).length) + R;
  }

  private renderDiv(): string {
    return chalk.dim('  ' + '─'.repeat(Math.max(10, this.cols - 4)));
  }

  private renderStatus(): string {
    const c = this.msgCount;
    const L = chalk.dim(`  ${c} msg${c !== 1 ? 's' : ''}`);
    const M = this.statusText ? chalk.dim(` │ ${this.statusText}`) : '';
    const R = chalk.dim('/help · /exit');
    const base = L + M;
    return base + spaces(this.cols - strip(base).length - strip(R).length) + R;
  }

  private renderInput(): string {
    const p = chalk.cyan('  You> ');
    const maxW = this.cols - 8;
    let d = this.inputBuffer.replace(/\n/g, '↵');
    if (strip(d).length > maxW) {
      const excess = strip(d).length - maxW;
      d = '…' + d.slice(excess + 1);
    }
    return p + d;
  }
}

const ANSI_RE = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
function strip(s: string): string {
  return s.replace(ANSI_RE, '');
}
function spaces(n: number): string {
  return n > 0 ? ' '.repeat(n) : '';
}

function wrapAnsi(text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    if (line.length === 0) {
      out.push('');
      continue;
    }
    const words = line.split(/(\s+)/);
    let cur = '';
    let curW = 0;
    for (const w of words) {
      const wW = strip(w).length;
      if (curW + wW > maxW && curW > 0) {
        out.push(cur);
        cur = w;
        curW = wW;
      } else {
        cur += w;
        curW += wW;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}
