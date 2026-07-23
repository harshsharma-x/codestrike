import { Command } from 'commander';
import chalk from 'chalk';
import { createRouter, ProviderRegistry } from '@codestrike/ai';
import { getDefaultProvider, getDefaultModel } from '../utils';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { ProjectIndexer } from '@codestrike/rag';
import { TUI } from '../utils/tui';
import {
  ChatSession,
  ChatMessage,
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
  setCurrentSession,
  getCurrentSessionId,
  generateId,
} from '../utils/session';
import { PROVIDER_INFO } from '@codestrike/shared';
import { getCurrentToken, isSetupComplete, listApiKeys } from '../utils/auth';

function resolveVersion(): string {
  const searchDirs = [__dirname];
  let d = __dirname;
  for (let i = 0; i < 5; i++) {
    const parent = join(d, '..');
    if (parent === d) break;
    searchDirs.push(parent);
    d = parent;
  }
  for (const dir of searchDirs) {
    try {
      const p = join(dir, 'package.json');
      const v = JSON.parse(readFileSync(p, 'utf-8')).version;
      if (v) return v;
    } catch {
      /* skip */
    }
  }
  return '0.1.0';
}
const PKG_VERSION = resolveVersion();

interface Ctx {
  router: ReturnType<typeof createRouter>;
  model: string;
  provider: string;
  projectContext: string;
  indexer: ProjectIndexer;
  cwd: string;
}

type Handler = (args: string[], tui: TUI, session: ChatSession, ctx: Ctx) => Promise<void>;

interface Cmd {
  handler: Handler;
  desc: string;
  usage?: string;
  category: string;
}

const COMMANDS: Record<string, Cmd> = {};

function def(name: string, handler: Handler, desc: string, category: string, usage?: string) {
  COMMANDS[name] = { handler, desc, usage, category };
}

function defaultSystemPrompt(): string {
  return 'You are CodeStrike AI, a helpful coding assistant. Use markdown formatting. Be concise and precise.';
}

function buildMsgs(
  msgs: ChatMessage[],
  projectCtx: string,
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const r: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  r.push({ role: 'system', content: defaultSystemPrompt() });
  if (projectCtx) r.push({ role: 'system', content: `Project:\n${projectCtx}` });
  for (const m of msgs) {
    if (m.role !== 'system') r.push({ role: m.role, content: m.content });
  }
  return r;
}

async function streamToTui(
  tui: TUI,
  ctx: Ctx,
  msgs: ChatMessage[],
  extraSystem?: string,
): Promise<string> {
  const tuiMsgs = buildMsgs(msgs, ctx.projectContext);
  if (extraSystem) tuiMsgs.unshift({ role: 'system' as const, content: extraSystem });

  tui.addMessage({ role: 'assistant', content: '' });
  tui.setBusy(true);
  tui.setStatus('streaming…');

  let full = '';
  try {
    const stream = ctx.router.stream({
      messages: tuiMsgs,
      model: ctx.model,
      provider: ctx.provider,
      temperature: 0.7,
      maxTokens: 4096,
    });
    for await (const chunk of stream) {
      if (chunk.content) {
        full += chunk.content;
        tui.appendToLast(chunk.content);
      }
    }
  } catch (e: any) {
    const err = e?.message || 'Unknown error';
    tui.appendToLast(`\n\n⚠ Error: ${err}`);
  } finally {
    tui.setBusy(false);
    tui.setStatus('');
  }
  return full;
}

async function streamWithSystem(
  tui: TUI,
  ctx: Ctx,
  userContent: string,
  systemPrompt: string,
): Promise<string> {
  tui.addMessage({ role: 'user', content: userContent });
  tui.addMessage({ role: 'assistant', content: '' });
  tui.setBusy(true);
  tui.setStatus('streaming…');

  let full = '';
  try {
    const msgs: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: defaultSystemPrompt() },
      { role: 'system', content: systemPrompt },
    ];
    if (ctx.projectContext)
      msgs.push({ role: 'system', content: `Project:\n${ctx.projectContext}` });
    msgs.push({ role: 'user', content: userContent });

    const stream = ctx.router.stream({
      messages: msgs,
      model: ctx.model,
      provider: ctx.provider,
      temperature: 0.7,
      maxTokens: 4096,
    });
    for await (const chunk of stream) {
      if (chunk.content) {
        full += chunk.content;
        tui.appendToLast(chunk.content);
      }
    }
  } catch (e: any) {
    const err = e?.message || 'Unknown error';
    tui.appendToLast(`\n\n⚠ Error: ${err}`);
  } finally {
    tui.setBusy(false);
    tui.setStatus('');
  }
  return full;
}

function autoSave(session: ChatSession): void {
  session.updatedAt = new Date().toISOString();
  if (session.messages.length >= 2 && session.title === 'New Chat') {
    const u = session.messages.find((m) => m.role === 'user');
    if (u) session.title = u.content.slice(0, 60) + (u.content.length > 60 ? '…' : '');
  }
  saveSession(session);
}

function newSession(model: string, provider: string): ChatSession {
  return {
    id: generateId(),
    title: 'New Chat',
    model,
    provider,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Chat commands ──
def(
  'help',
  async (args, tui) => {
    const cats = new Map<string, Cmd[]>();
    for (const [name, cmd] of Object.entries(COMMANDS)) {
      const c = cmd.category || 'other';
      if (!cats.has(c)) cats.set(c, []);
      cats.get(c)!.push({ ...cmd, name } as any);
    }
    const lines: string[] = ['**Available Commands:**\n'];
    for (const [cat, cmds] of cats) {
      lines.push(`**${cat}:**`);
      for (const c of cmds) {
        const u = (c as any).usage ? ` ${(c as any).usage}` : '';
        lines.push(`  \`/${(c as any).name}${u}\` — ${c.desc}`);
      }
      lines.push('');
    }
    lines.push('Type `/command --help` for details on any command.');
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'Show this help',
  'chat',
);

def(
  'clear',
  async (args, tui, session) => {
    session.messages = [];
    tui.clearMessages();
    tui.addMessage({ role: 'system', content: 'Conversation cleared.' });
  },
  'Clear conversation',
  'chat',
);

def(
  'save',
  async (args, tui, session) => {
    const title = args.join(' ') || session.title;
    session.title = title;
    autoSave(session);
    tui.addMessage({ role: 'system', content: `✓ Session saved: \`${session.id}\`` });
  },
  'Save current session',
  'chat',
  '[title]',
);

def(
  'load',
  async (args, tui, session) => {
    const id = args[0];
    if (!id) {
      tui.addMessage({ role: 'system', content: 'Usage: `/load <session-id>`' });
      return;
    }
    const loaded = loadSession(id);
    if (!loaded) {
      tui.addMessage({ role: 'system', content: `Session not found: ${id}` });
      return;
    }
    session.id = loaded.id;
    session.title = loaded.title;
    session.messages = loaded.messages;
    session.model = loaded.model;
    session.provider = loaded.provider;
    setCurrentSession(id);
    tui.clearMessages();
    for (const m of loaded.messages) tui.addMessage(m);
    tui.setModel(loaded.model);
    tui.setProvider(loaded.provider);
    tui.addMessage({ role: 'system', content: `✓ Loaded session: **${loaded.title}**` });
  },
  'Load a previous session',
  'chat',
  '<id>',
);

def(
  'list',
  async (args, tui) => {
    const sessions = listSessions();
    if (sessions.length === 0) {
      tui.addMessage({ role: 'system', content: 'No saved sessions.' });
      return;
    }
    const lines = ['**Saved Sessions:**\n'];
    for (const s of sessions) {
      const cur = s.id === getCurrentSessionId() ? ' ← current' : '';
      lines.push(`  \`${s.id.slice(0, 8)}\` **${s.title}**${cur}`);
      lines.push(`  ${s.messages.length} msgs · ${s.model}`);
    }
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'List saved sessions',
  'chat',
);

def(
  'delete',
  async (args, tui) => {
    const id = args[0];
    if (!id) {
      tui.addMessage({ role: 'system', content: 'Usage: `/delete <session-id>`' });
      return;
    }
    deleteSession(id);
    tui.addMessage({ role: 'system', content: `✓ Deleted: ${id}` });
  },
  'Delete a saved session',
  'chat',
  '<id>',
);

def(
  'model',
  async (args, tui, session, ctx) => {
    if (args[0]) {
      session.model = args[0];
      ctx.model = args[0];
      tui.setModel(args[0]);
      tui.addMessage({ role: 'system', content: `✓ Model → **${args[0]}**` });
    } else {
      tui.addMessage({ role: 'system', content: `Current model: **${session.model}**` });
    }
  },
  'Show or switch AI model',
  'chat',
  '[name]',
);

def(
  'provider',
  async (args, tui, session, ctx) => {
    if (args[0]) {
      session.provider = args[0];
      ctx.provider = args[0];
      tui.setProvider(args[0]);
      tui.addMessage({ role: 'system', content: `✓ Provider → **${args[0]}**` });
    } else {
      tui.addMessage({ role: 'system', content: `Current provider: **${session.provider}**` });
    }
  },
  'Show or switch AI provider',
  'chat',
  '[name]',
);

def(
  'tokens',
  async (args, tui, session) => {
    const total = session.messages.reduce((s, m) => s + m.content.length, 0);
    tui.addMessage({
      role: 'system',
      content: `Characters: ${total} · Est. tokens: ~${Math.round(total / 4)}`,
    });
  },
  'Show token estimate',
  'chat',
);

def(
  'context',
  async (args, tui, session) => {
    tui.addMessage({ role: 'system', content: `Messages in context: ${session.messages.length}` });
  },
  'Show context length',
  'chat',
);

def(
  'status',
  async (args, tui, session) => {
    const lines = [
      `**Session**`,
      `  ID: \`${session.id}\``,
      `  Title: **${session.title}**`,
      `  Model: ${session.model}`,
      `  Provider: ${session.provider}`,
      `  Messages: ${session.messages.length}`,
    ];
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'Show session and project status',
  'chat',
);

// ── AI commands ──
def(
  'explain',
  async (args, tui, session, ctx) => {
    const input = args.join(' ');
    if (!input) {
      tui.addMessage({ role: 'system', content: 'Usage: `/explain <code or question>`' });
      return;
    }
    const content = existsSync(input) ? readFileSync(input, 'utf-8') : input;
    await streamWithSystem(
      tui,
      ctx,
      content,
      'Explain the following code or concept clearly and concisely.',
    );
  },
  'Explain code or concepts',
  'ai',
  '<code|file>',
);

def(
  'debug',
  async (args, tui, session, ctx) => {
    const input = args.join(' ');
    if (!input) {
      tui.addMessage({
        role: 'system',
        content: 'Usage: `/debug <error message>` or `/debug -f <file>`',
      });
      return;
    }
    let content = input;
    if (args[0] === '-f' && args[1]) {
      content = existsSync(args[1]) ? readFileSync(args[1], 'utf-8') : args[1];
    }
    await streamWithSystem(
      tui,
      ctx,
      content,
      'Debug the following error or code. Identify the root cause and provide a fix.',
    );
  },
  'Debug code or errors',
  'ai',
  '<error|-f file>',
);

def(
  'fix',
  async (args, tui, session, ctx) => {
    const file = args[0];
    if (!file || !existsSync(file)) {
      tui.addMessage({ role: 'system', content: 'Usage: `/fix <file>`' });
      return;
    }
    const code = readFileSync(file, 'utf-8');
    await streamWithSystem(
      tui,
      ctx,
      code,
      `Fix bugs in this file (${file}). Show the fixed code and explain changes.`,
    );
  },
  'Fix bugs in a file',
  'ai',
  '<file>',
);

def(
  'review',
  async (args, tui, session, ctx) => {
    const files = args.length > 0 ? args : existsSync('codestrike.json') ? ['codestrike.json'] : [];
    if (files.length === 0) {
      tui.addMessage({ role: 'system', content: 'Usage: `/review [files...]` or `/review --all`' });
      return;
    }
    let content = '';
    for (const f of files) {
      if (existsSync(f)) content += `\n// ${f}\n${readFileSync(f, 'utf-8')}\n`;
    }
    if (!content) {
      tui.addMessage({ role: 'system', content: 'No files found.' });
      return;
    }
    await streamWithSystem(
      tui,
      ctx,
      content,
      'Review the following code. Identify issues, suggest improvements, and note best practices.',
    );
  },
  'Review code files',
  'ai',
  '[files...]',
);

def(
  'test',
  async (args, tui, session, ctx) => {
    const file = args[0];
    const framework = args.includes('-f') ? args[args.indexOf('-f') + 1] || 'vitest' : 'vitest';
    if (!file || !existsSync(file)) {
      tui.addMessage({ role: 'system', content: 'Usage: `/test <file> [-f framework]`' });
      return;
    }
    const code = readFileSync(file, 'utf-8');
    await streamWithSystem(
      tui,
      ctx,
      code,
      `Generate ${framework} tests for this file. Include edge cases and mocks where needed.`,
    );
  },
  'Generate tests for a file',
  'ai',
  '<file> [-f framework]',
);

def(
  'docs',
  async (args, tui, session, ctx) => {
    const file = args[0];
    const type = args.includes('-t') ? args[args.indexOf('-t') + 1] || 'readme' : 'readme';
    if (!file || !existsSync(file)) {
      tui.addMessage({ role: 'system', content: 'Usage: `/docs <file> [-t api|readme|inline]`' });
      return;
    }
    const code = readFileSync(file, 'utf-8');
    await streamWithSystem(
      tui,
      ctx,
      code,
      `Generate ${type} documentation for this code. Be thorough and well-structured.`,
    );
  },
  'Generate documentation',
  'ai',
  '<file> [-t type]',
);

def(
  'agent',
  async (args, tui, session, ctx) => {
    if (args.length < 2) {
      tui.addMessage({
        role: 'system',
        content:
          'Usage: `/agent <type> <task>`\nTypes: planner, architect, coder, reviewer, debugger, security, documentation, testing, git, deployment',
      });
      return;
    }
    const type = args[0];
    const task = args.slice(1).join(' ');
    const valid = [
      'planner',
      'architect',
      'coder',
      'reviewer',
      'debugger',
      'security',
      'documentation',
      'testing',
      'git',
      'deployment',
    ];
    if (!valid.includes(type)) {
      tui.addMessage({
        role: 'system',
        content: `Invalid agent type: ${type}. Valid: ${valid.join(', ')}`,
      });
      return;
    }
    await streamWithSystem(
      tui,
      ctx,
      task,
      `You are a ${type} agent. Complete the following task thoroughly.`,
    );
  },
  'Run an AI agent',
  'ai',
  '<type> <task>',
);

def(
  'search',
  async (args, tui, session, ctx) => {
    const query = args.join(' ');
    if (!query) {
      tui.addMessage({ role: 'system', content: 'Usage: `/search <query>`' });
      return;
    }
    tui.setBusy(true);
    tui.setStatus('searching…');
    try {
      const entries = await ctx.indexer.indexProject(ctx.cwd);
      const results = await (await import('@codestrike/rag')).semanticSearch(query, entries, 10);
      if (results.length === 0) {
        tui.addMessage({ role: 'system', content: 'No results found.' });
        return;
      }
      const lines = [`**Search results for:** ${query}\n`];
      for (const r of results) {
        lines.push(`  \`${r.entry.path}\` — score: ${Math.round(r.score)}`);
        if (r.entry.summary) lines.push(`    ${r.entry.summary}`);
      }
      tui.addMessage({ role: 'system', content: lines.join('\n') });
    } catch {
      tui.addMessage({ role: 'system', content: 'Search failed. Try `/index` first.' });
    } finally {
      tui.setBusy(false);
      tui.setStatus('');
    }
  },
  'Search project files',
  'ai',
  '<query>',
);

// ── Project commands ──
def(
  'index',
  async (args, tui, session, ctx) => {
    tui.setBusy(true);
    tui.setStatus('indexing…');
    try {
      await ctx.indexer.indexProject(ctx.cwd);
      const s = (ctx.indexer as any).status;
      tui.addMessage({
        role: 'system',
        content: `✓ Indexed ${s?.files || 0} files (${s?.languages || 0} languages)`,
      });
      ctx.projectContext = (ctx.indexer as any).getProjectStructure?.() || '';
    } catch {
      tui.addMessage({ role: 'system', content: '⚠ Indexing failed.' });
    } finally {
      tui.setBusy(false);
      tui.setStatus('');
    }
  },
  'Index current project',
  'project',
);

def(
  'init',
  async (args, tui) => {
    tui.suspend();
    const { initCommand } = await import('./init');
    await initCommand.parseAsync(['node', 'init', ...args], { from: 'user' });
    tui.resume();
    tui.addMessage({ role: 'system', content: '✓ Project initialized.' });
  },
  'Initialize codestrike.json',
  'project',
);

def(
  'config',
  async (args, tui) => {
    const configPath = join(process.cwd(), 'codestrike.json');
    if (!existsSync(configPath)) {
      tui.addMessage({ role: 'system', content: 'No codestrike.json found. Run `/init`.' });
      return;
    }
    const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
    const lines = ['**Project Config:**\n'];
    for (const [k, v] of Object.entries(cfg)) {
      lines.push(`  **${k}:** ${JSON.stringify(v)}`);
    }
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'View project configuration',
  'project',
);

def(
  'login',
  async (args, tui) => {
    tui.suspend();
    const { loginCommand } = await import('./login');
    await loginCommand.parseAsync(['node', 'login', ...args], { from: 'user' });
    tui.resume();
    tui.addMessage({ role: 'system', content: '✓ API keys configured.' });
  },
  'Configure API keys',
  'project',
  '[provider]',
);

def(
  'logout',
  async (args, tui) => {
    tui.suspend();
    const { logoutCommand } = await import('./logout');
    await logoutCommand.parseAsync(['node', 'logout', ...args], { from: 'user' });
    tui.resume();
    tui.addMessage({ role: 'system', content: '✓ API keys removed.' });
  },
  'Remove stored API keys',
  'project',
  '[-a|-p provider]',
);

// ── System commands ──
def(
  'models',
  async (args, tui) => {
    const reg = ProviderRegistry.getInstance();
    const providers = reg.getAllProviders();
    const lines = ['**Available Models:**\n'];
    for (const p of providers) {
      const info = (PROVIDER_INFO as any)[p.name];
      const hasKey = info?.envKey ? !!process.env[info.envKey] : true;
      const status = hasKey ? chalk.green('✓').toString() : chalk.yellow('✗').toString();
      const free = info?.free ? ' (free)' : '';
      lines.push(`  ${status} **${p.displayName}**${free} — \`${p.defaultModel}\``);
    }
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'List available AI models',
  'system',
);

def(
  'providers',
  async (args, tui) => {
    const reg = ProviderRegistry.getInstance();
    const providers = reg.getAllProviders();
    const lines = ['**AI Providers:**\n'];
    for (const p of providers) {
      const info = (PROVIDER_INFO as any)[p.name];
      const hasKey = info?.envKey ? !!process.env[info.envKey] : true;
      const status = hasKey ? chalk.green('✓').toString() : chalk.yellow('✗').toString();
      lines.push(`  ${status} **${p.displayName}** — ${info?.envKey || 'built-in'}`);
    }
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'List AI providers',
  'system',
);

def(
  'doctor',
  async (args, tui) => {
    tui.setBusy(true);
    tui.setStatus('checking…');
    try {
      const checks: { name: string; pass: boolean; msg: string }[] = [];
      const nodeVer = process.version.slice(1);
      checks.push({ name: 'Node.js ≥18', pass: parseInt(nodeVer) >= 18, msg: nodeVer });
      try {
        execSync('git --version', { stdio: 'pipe' });
        checks.push({ name: 'Git installed', pass: true, msg: 'ok' });
      } catch {
        checks.push({ name: 'Git installed', pass: false, msg: 'not found' });
      }
      const cfgPath = join(process.cwd(), 'codestrike.json');
      checks.push({
        name: 'codestrike.json',
        pass: existsSync(cfgPath),
        msg: existsSync(cfgPath) ? 'found' : 'missing',
      });
      for (const info of Object.values(PROVIDER_INFO) as any[]) {
        if (info.envKey) {
          const has = !!process.env[info.envKey];
          checks.push({ name: `${info.name} key`, pass: has, msg: has ? 'set' : 'missing' });
        }
      }
      const lines = ['**System Health:**\n'];
      for (const c of checks) {
        const icon = c.pass ? chalk.green('✓').toString() : chalk.red('✗').toString();
        lines.push(`  ${icon} **${c.name}** — ${c.msg}`);
      }
      tui.addMessage({ role: 'system', content: lines.join('\n') });
    } finally {
      tui.setBusy(false);
      tui.setStatus('');
    }
  },
  'Check system health',
  'system',
);

def(
  'benchmark',
  async (args, tui) => {
    tui.suspend();
    const { benchmarkCommand } = await import('./benchmark');
    await benchmarkCommand.parseAsync(['node', 'benchmark', ...args], { from: 'user' });
    tui.resume();
  },
  'Benchmark AI providers',
  'system',
  '[-q|-p provider]',
);

def(
  'auto-detect',
  async (args, tui) => {
    tui.suspend();
    const { autoDetectCommand } = await import('./auto-detect');
    await autoDetectCommand.parseAsync(['node', 'auto-detect', ...args], { from: 'user' });
    tui.resume();
  },
  'Auto-detect best provider',
  'system',
  '[-s]',
);

def(
  'update',
  async (args, tui) => {
    try {
      const latest = execSync('npm view codestrike version 2>/dev/null', {
        encoding: 'utf-8',
      }).trim();
      tui.addMessage({ role: 'system', content: `Current: 0.1.0 · Latest: ${latest}` });
    } catch {
      tui.addMessage({ role: 'system', content: 'Could not check for updates.' });
    }
  },
  'Check for updates',
  'system',
);

def(
  'run',
  async (args, tui) => {
    if (args.length === 0) {
      tui.addMessage({ role: 'system', content: 'Usage: `/run <command>`' });
      return;
    }
    const cmd = args.join(' ');
    tui.setBusy(true);
    tui.setStatus(`running: ${cmd}`);
    try {
      const out = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
      const lines = out.split('\n').slice(0, 50);
      tui.addMessage({
        role: 'system',
        content: `**$ ${cmd}**\n\`\`\`\n${lines.join('\n')}\n\`\`\``,
      });
    } catch (e: any) {
      tui.addMessage({
        role: 'system',
        content: `**$ ${cmd}**\n\`\`\`\n${e?.stdout || e?.message || 'Error'}\n\`\`\``,
      });
    } finally {
      tui.setBusy(false);
      tui.setStatus('');
    }
  },
  'Execute a shell command',
  'system',
  '<command>',
);

def(
  'terminal',
  async (args, tui) => {
    tui.suspend();
    const { terminalCommand } = await import('./terminal');
    await terminalCommand.parseAsync(['node', 'terminal', ...args], { from: 'user' });
    tui.resume();
  },
  'Open integrated terminal',
  'system',
);

def(
  'memory',
  async (args, tui) => {
    try {
      const mod = await import('@codestrike/memory');
      const store = new mod.MemoryStore();
      const action = args[0] || 'show';
      if (action === 'show') {
        const prefs = store.getPreferences();
        const lines = [
          '**AI Memory:**\n',
          ...Object.entries(prefs || {}).map(([k, v]) => `  **${k}:** ${JSON.stringify(v)}`),
        ];
        tui.addMessage({ role: 'system', content: lines.join('\n') });
      } else if (action === 'clear') {
        store.clear();
        tui.addMessage({ role: 'system', content: '✓ Memory cleared.' });
      } else {
        tui.addMessage({ role: 'system', content: 'Usage: `/memory [show|clear]`' });
      }
    } catch {
      tui.addMessage({ role: 'system', content: 'Memory system unavailable.' });
    }
  },
  'View/manage AI memory',
  'system',
  '[show|clear]',
);

def(
  'mcp',
  async (args, tui) => {
    tui.suspend();
    const { mcpCommand } = await import('./mcp');
    await mcpCommand.parseAsync(['node', 'mcp', ...args], { from: 'user' });
    tui.resume();
  },
  'Manage MCP servers',
  'system',
  'list|add|remove|test',
);

def(
  'plugins',
  async (args, tui) => {
    tui.suspend();
    const { pluginsCommand } = await import('./plugins');
    await pluginsCommand.parseAsync(['node', 'plugins', ...args], { from: 'user' });
    tui.resume();
  },
  'Manage plugins',
  'system',
  '[list|load]',
);

def(
  'pipeline',
  async (args, tui) => {
    tui.suspend();
    const { pipelineCommand } = await import('./pipeline');
    await pipelineCommand.parseAsync(['node', 'pipeline', ...args], { from: 'user' });
    tui.resume();
  },
  'Run AI pipelines',
  'system',
  'list|show|run <template> <task>',
);

def(
  'sessions',
  async (args, tui, session) => {
    const sessions = listSessions();
    if (sessions.length === 0) {
      tui.addMessage({ role: 'system', content: 'No saved sessions.' });
      return;
    }
    const lines = ['**All Sessions:**\n'];
    for (const s of sessions) {
      const cur = s.id === getCurrentSessionId() ? ' ← current' : '';
      lines.push(`  \`${s.id.slice(0, 8)}\` **${s.title}**${cur}`);
      lines.push(
        `  ${s.messages.length} msgs · ${s.model} · ${new Date(s.updatedAt).toLocaleDateString()}`,
      );
    }
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'Manage all sessions',
  'system',
  '[action] [id]',
);

// ── Git commands ──
def(
  'commit',
  async (args, tui) => {
    tui.suspend();
    const { commitCommand } = await import('./commit');
    await commitCommand.parseAsync(['node', 'commit', ...args], { from: 'user' });
    tui.resume();
  },
  'Generate commit message',
  'git',
  '[-m|-y]',
);

def(
  'pr',
  async (args, tui) => {
    tui.suspend();
    const { prCommand } = await import('./pr');
    await prCommand.parseAsync(['node', 'pr', ...args], { from: 'user' });
    tui.resume();
  },
  'Create a pull request',
  'git',
  '[base] [-t|-d|-y]',
);

// ── Auth commands ──
def(
  'auth',
  async (args, tui) => {
    const token = getCurrentToken();
    const keys = listApiKeys().map((k) => k.provider);
    const lines: string[] = ['**Authentication Status:**\n'];
    if (token) {
      lines.push(
        `  ${chalk.green('✓')} Signed in as **${token.userInfo.name}** (${token.provider})`,
      );
      if (token.userInfo.email) lines.push(`  Email: ${token.userInfo.email}`);
    } else {
      lines.push(`  Not authenticated.`);
      lines.push(`  Run \`codestrike auth login github\` or \`codestrike auth login google\``);
    }
    lines.push('');
    lines.push(`**API Keys:** ${keys.length > 0 ? keys.join(', ') : 'None configured'}`);
    lines.push('');
    lines.push(`**To manage:** \`codestrike auth status\``);
    tui.addMessage({ role: 'system', content: lines.join('\n') });
  },
  'Show authentication status',
  'system',
);

def(
  'setup',
  async (args, tui) => {
    tui.suspend();
    const { setupCommand } = await import('./setup');
    await setupCommand.parseAsync(['node', 'setup'], { from: 'user' });
    tui.resume();
    if (isSetupComplete()) {
      tui.addMessage({
        role: 'system',
        content: '✓ Setup complete. You can now use all features.',
      });
    }
  },
  'Run the setup wizard',
  'system',
);

// ── Register all command names for tab completion ──
const COMMAND_NAMES = Object.keys(COMMANDS).sort();

// ── Main loop ──
async function chatLoop(tui: TUI, session: ChatSession, ctx: Ctx): Promise<void> {
  tui.setCommands(COMMAND_NAMES);
  const curToken = getCurrentToken();
  if (curToken) tui.setUserName(curToken.userInfo.name);
  tui.setModel(ctx.model);
  tui.setProvider(ctx.provider);
  tui.setSessionId(session.id);
  tui.addMessage({
    role: 'system',
    content:
      'Welcome to **CodeStrike AI**! Type `/help` to see all commands. Press `↑` for history, `Tab` for completions.',
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const input = await tui.ask();
    if (!input) continue;

    if (input === '/exit' || input === '/quit') {
      autoSave(session);
      tui.addMessage({ role: 'system', content: 'Goodbye! 👋' });
      break;
    }

    if (input.startsWith('/')) {
      const parts = input.slice(1).split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const cmdArgs = parts.slice(1);

      if (cmdArgs.includes('--help') || cmdArgs.includes('-h')) {
        const def = COMMANDS[cmd];
        if (def) {
          const usage = def.usage ? ` /${cmd} ${def.usage}` : ` /${cmd}`;
          tui.addMessage({
            role: 'system',
            content: `**/${cmd}** — ${def.desc}\nUsage: \`${usage}\`\nCategory: ${def.category}`,
          });
        } else {
          tui.addMessage({ role: 'system', content: `Unknown command: /${cmd}` });
        }
        continue;
      }

      const def = COMMANDS[cmd];
      if (def) {
        try {
          await def.handler(cmdArgs, tui, session, ctx);
        } catch (e: any) {
          tui.addMessage({ role: 'system', content: `⚠ Error in /${cmd}: ${e?.message || e}` });
        }
      } else {
        tui.addMessage({
          role: 'system',
          content: `Unknown command: \`/${cmd}\`. Type \`/help\` for available commands.`,
        });
      }
    } else {
      session.messages.push({ role: 'user', content: input });
      tui.addMessage({ role: 'user', content: input });
      const response = await streamToTui(tui, ctx, session.messages);
      session.messages.push({ role: 'assistant', content: response });
      autoSave(session);
      tui.setSessionId(session.id);
    }
  }
}

// ── Command definition ──
export const chatCommand = new Command('chat')
  .description('Professional TUI chat with AI')
  .argument('[message]', 'Initial message (non-interactive)')
  .option('-m, --model <model>', 'AI model to use')
  .option('-p, --provider <provider>', 'AI provider to use')
  .option('--no-index', 'Skip project indexing')
  .option('-s, --session <id>', 'Resume a previous session')
  .action(async (message, options) => {
    const router = createRouter({
      primaryProvider: (options.provider as any) || getDefaultProvider(),
    });
    const indexer = new ProjectIndexer();
    const model = options.model || getDefaultModel();
    const provider = (options.provider as any) || getDefaultProvider();
    const cwd = process.cwd();

    let session: ChatSession;
    if (options.session) {
      const existing = loadSession(options.session);
      session = existing ? existing : newSession(model, provider);
    } else {
      session = newSession(model, provider);
    }
    setCurrentSession(session.id);

    let projectContext = '';
    const configPath = join(cwd, 'codestrike.json');
    if (existsSync(configPath) && options.index !== false) {
      try {
        await indexer.indexProject(cwd);
        projectContext = (indexer as any).getProjectStructure?.() || '';
      } catch {
        /* indexing is optional */
      }
    }

    const ctx: Ctx = { router, model, provider, projectContext, indexer, cwd };

    if (message) {
      const tui = new TUI();
      tui.setVersion(PKG_VERSION);
      tui.init();
      tui.setVersion(PKG_VERSION);
      try {
        session.messages.push({ role: 'user', content: message });
        tui.addMessage({ role: 'user', content: message });
        const response = await streamToTui(tui, ctx, session.messages);
        session.messages.push({ role: 'assistant', content: response });
        autoSave(session);
        await tui.ask('Press Enter to exit…');
      } finally {
        tui.destroy();
      }
      return;
    }

    const tui = new TUI();
    tui.setVersion(PKG_VERSION);
    try {
      tui.init();
      tui.setVersion(PKG_VERSION);
      await chatLoop(tui, session, ctx);
    } finally {
      tui.destroy();
    }
  });
