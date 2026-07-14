import { useState, useEffect, useRef } from 'react';

const LINES = [
  { text: '', delay: 300 },
  { text: '⚡ CodeStrike AI — Launch Terminal v0.1.0', type: 'output muted', delay: 100 },
  { text: '', delay: 50 },
  { text: '$ codestrike doctor', type: 'prompt', delay: 600 },
  { text: '  ✓ Node.js v20.11.0', type: 'output green', delay: 200 },
  { text: '  ✓ Git installed', type: 'output green', delay: 200 },
  { text: '  ✓ 16 AI providers configured', type: 'output green', delay: 300 },
  { text: '  ✓ 24 CLI commands ready', type: 'output green', delay: 250 },
  { text: '  ✓ 10 specialized agents online', type: 'output green', delay: 250 },
  { text: '', delay: 150 },
  { text: '$ codestrike providers --free', type: 'prompt', delay: 500 },
  { text: '  OpenRouter    • 100+ models • Free tier', type: 'output', delay: 150 },
  { text: '  Groq          • mixtral-8x7b • 30 req/min free', type: 'output', delay: 150 },
  { text: '  HuggingFace   • 200k+ models • Rate-limited free', type: 'output', delay: 150 },
  { text: '  Ollama        • Local • Fully offline', type: 'output green', delay: 150 },
  { text: '  LM Studio     • Local • BYO model', type: 'output green', delay: 150 },
  { text: '  Gemini        • gemini-2.5-flash • Free', type: 'output', delay: 150 },
  { text: '  Nemotron      • NVIDIA • Free API', type: 'output', delay: 150 },
  { text: '', delay: 100 },
  { text: '$ codestrike chat "build a react app"', type: 'prompt', delay: 500 },
  { text: '', delay: 150 },
  { text: '  ┌─ Planner ───────────────────────────────┐', type: 'output cyan', delay: 200 },
  { text: '  │ Analyzing project requirements...        │', type: 'output cyan', delay: 200 },
  { text: '  │ Creating architecture specification...   │', type: 'output cyan', delay: 200 },
  { text: '  └──────────────────────────────────────────┘', type: 'output cyan', delay: 200 },
  { text: '', delay: 100 },
  { text: '  ┌─ Coder ─────────────────────────────────┐', type: 'output', delay: 250 },
  { text: '  │ ✓ src/App.tsx created                   │', type: 'output green', delay: 120 },
  { text: '  │ ✓ src/components/Header.tsx created     │', type: 'output green', delay: 120 },
  { text: '  │ ✓ src/styles/globals.css created        │', type: 'output green', delay: 120 },
  { text: '  └──────────────────────────────────────────┘', type: 'output', delay: 200 },
  { text: '', delay: 150 },
  { text: '$  All systems online. Ready to strike.  ', type: 'prompt', delay: 300 },
];

export default function Hero() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lineIdx >= LINES.length) return;
    const line = LINES[lineIdx];
    const t = setTimeout(() => {
      setVisibleLines(prev => [...prev, lineIdx]);
      setLineIdx(i => i + 1);
    }, line.delay);
    return () => clearTimeout(t);
  }, [lineIdx]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="hero-section">
      <div className="hero-content">
        <div style={{ maxWidth: 720 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 16 }}>
            {'//  CodeStrike AI — Open-source AI coding assistant'}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Code<span style={{ color: 'var(--accent)' }}>Strike</span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 28,
            lineHeight: 1.7,
          }}>
            Multi-agent code generation, debugging, and project analysis —{' '}
            <span style={{ color: 'var(--accent-green)' }}>entirely in your terminal.</span>
            <br />
            16 AI providers · 24 CLI commands · 10 agents · 100% open source
          </p>
        </div>

        <div className="terminal-window" style={{ maxWidth: 720 }}>
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="terminal-title">bash — codestrike-launch</span>
          </div>
          <div className="terminal-body" ref={containerRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
            {LINES.map((line, idx) => {
              const isVisible = visibleLines.includes(idx);
              if (!isVisible) return null;
              const isLast = idx === visibleLines.length - 1 && idx < LINES.length - 1;
              return (
                <div key={idx} className="terminal-line" style={{ minHeight: line.text ? 18 : 10 }}>
                  {line.type === 'prompt' && <span className="terminal-prompt">{line.text}</span>}
                  {line.type === 'output' && <span className="terminal-output">{line.text}</span>}
                  {line.type === 'output green' && <span className="terminal-output green">{line.text}</span>}
                  {line.type === 'output cyan' && <span className="terminal-output cyan">{line.text}</span>}
                  {line.type === 'output muted' && <span className="terminal-output muted">{line.text}</span>}
                  {!line.type && line.text && <span className="terminal-output">{line.text}</span>}
                  {!line.type && !line.text && <span>&nbsp;</span>}
                  {isLast && <span className="terminal-cursor" />}
                </div>
              );
            })}
            {visibleLines.length >= LINES.length && (
              <div className="terminal-line" style={{ marginTop: 6 }}>
                <span className="terminal-prompt">$ </span>
                <span className="terminal-cursor" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
