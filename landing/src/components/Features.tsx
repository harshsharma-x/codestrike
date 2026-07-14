const FEATURES = [
  {
    icon: 'M12 6v12M6 12h12',
    title: 'Multi-Agent System',
    desc: '10 specialized agents — Planner, Architect, Coder, Reviewer, Tester, Debugger, Documenter, Optimizer, Security Auditor, and DevOps — working in concert on your codebase.',
    tags: ['Planner', 'Architect', 'Coder', '+7 more'],
    tagStyle: '',
  },
  {
    icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
    title: '16 AI Providers',
    desc: 'Massive provider ecosystem — free tiers, local models (Ollama), and premium APIs (OpenAI, Anthropic, Gemini, DeepSeek). Bring your own key or run fully offline.',
    tags: ['Groq', 'Ollama', 'OpenAI', 'Gemini', '+12 more'],
    tagStyle: 'green',
  },
  {
    icon: 'M4 7V4a1 1 0 011-1h4M4 7v12a1 1 0 001 1h14a1 1 0 001-1V7M4 7h16',
    icon2: 'M8 12h8M12 8v8',
    title: 'RAG & Project Indexing',
    desc: 'Index your entire codebase for contextually aware AI. Semantic search across files, functions, and dependencies — no more blind responses from your AI.',
    tags: ['Semantic Search', 'Codebase Indexing', 'Embeddings'],
    tagStyle: 'purple',
  },
  {
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
    title: 'Plugin System',
    desc: 'Extend CodeStrike with custom plugins. Load from npm packages or local paths. Add new AI providers, agent types, or CLI commands via a clean plugin manifest.',
    tags: ['Plugin Registry', 'npm', 'Custom Providers'],
    tagStyle: 'cyan',
  },
  {
    icon: 'M5 5h14M5 12h14M5 19h14',
    title: '24 CLI Commands',
    desc: 'Every tool you need: init, chat, explain, debug, fix, test, docs, search, review, commit, models, doctor, config, index, status, run, login, terminal, session, providers, agent, memory, plugins, update.',
    tags: ['Full Suite', 'Chat', 'Git', 'Terminal'],
    tagStyle: '',
  },
  {
    icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
    title: '100% Open Source',
    desc: 'Fully MIT-licensed. No hidden enterprise tiers, no proprietary modules. The entire codebase is on GitHub for audit, fork, and contribution. Community-driven development.',
    tags: ['MIT License', 'GitHub', 'Community'],
    tagStyle: 'orange',
  },
];

function SvgIcon({ paths, style }: { paths: (string | undefined)[]; style?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths.filter((d): d is string => !!d).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export default function Features() {
  return (
    <div className="section" id="features">
      <div className="section-header">
        <div className="section-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          packages/features.ts
        </div>
        <div className="section-title">
          Everything you need for <span className="highlight">AI-powered development</span>
        </div>
        <div className="section-subtitle">
          A complete toolkit built for the terminal — from code generation to deep project analysis.
        </div>
      </div>
      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card fade-in visible" style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="feature-card-header">
              <SvgIcon paths={[f.icon, f.icon2]} />
              {f.title}
            </div>
            <div className="feature-card-body">
              <p>{f.desc}</p>
              <div className="feature-tags">
                {f.tags.map((t, j) => (
                  <span key={j} className={`feature-tag ${f.tagStyle}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
