const STEPS = [
  {
    cmd: 'codestrike init',
    desc: 'Initialize CodeStrike in your project',
    output: '✓ Created codestrike.json\n✓ Created .codestrike/ directory\n✓ Project indexed (42 files)',
  },
  {
    cmd: 'codestrike doctor',
    desc: 'Verify everything works',
    output: '✓ Node.js v20.11.0\n✓ Git installed\n✓ API keys configured\n✓ All systems online',
  },
  {
    cmd: 'codestrike chat "explain the main server file"',
    desc: 'Start chatting with your codebase',
    output: '┌─ Analyzer ─────────────────────────────┐\n│ server.ts — Express API entry point      │\n│ • 127 lines • 4 routes • middleware: auth │\n│ • DB: PostgreSQL via Prisma              │\n└──────────────────────────────────────────┘',
  },
  {
    cmd: 'codestrike commit',
    desc: 'AI generates commit messages from staged changes',
    output: '✨ Suggested: feat: add user authentication middleware\n? Accept commit message? (Y/n)',
  },
  {
    cmd: 'codestrike providers',
    desc: 'Browse available AI providers',
    output: '  Groq          • Free   • mixtral-8x7b-32768\n  OpenAI        • Paid   • gpt-4o\n  Ollama        • Free   • codellama (local)\n  Gemini        • Free   • gemini-2.5-flash\n  ... 12 more',
  },
];

export default function QuickStart() {
  return (
    <div className="section" id="quickstart" style={{ background: 'var(--bg-secondary)' }}>
      <div className="section-header">
        <div className="section-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          terminal/demo.sh
        </div>
        <div className="section-title">
          See it in <span className="highlight-cyan">action</span>
        </div>
        <div className="section-subtitle">
          From zero to AI-powered development in seconds.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((step, i) => (
          <div key={i} className="step-card fade-in visible" style={{ transitionDelay: `${i * 100}ms` }}>
            <div className="step-header">
              <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="step-cmd">
                  <span className="step-prompt">$</span> {step.cmd}
                </div>
                <div className="step-desc">{step.desc}</div>
              </div>
            </div>
            <div className="step-output">
              <pre>{step.output}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
