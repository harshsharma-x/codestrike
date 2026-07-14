const MODULES = ['CLI', 'Providers', 'Agents', 'Plugins', 'Memory', 'Tools', 'RAG', 'Git', 'Terminal'];

export default function Architecture() {
  return (
    <div className="section" id="architecture">
      <div className="section-header">
        <div className="section-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          monorepo Architecture
        </div>
        <div className="section-title">
          Built with <span className="highlight-purple">modularity</span> at its core
        </div>
        <div className="section-subtitle">
          <span style={{ fontFamily: 'var(--font-mono)' }}>apps/</span> (3) +{' '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>packages/</span> (11) — npm workspaces monorepo.
        </div>
      </div>
      <div className="arch-grid">
        {MODULES.map((m, i) => (
          <div key={i} className="arch-module fade-in visible" style={{ transitionDelay: `${i * 40}ms` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, margin: '0 auto 4px', display: 'block', opacity: 0.7 }}>
              {i === 0 && <><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>}
              {i === 1 && <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>}
              {i === 2 && <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/></>}
              {i === 3 && <><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></>}
              {i === 4 && <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M12 22V12"/></>}
              {i === 5 && <><path d="M14.7 6.3a1 1 0 00 0 1.4l1.6 1.6a1 1 0 00 1.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>}
              {i === 6 && <><path d="M4 7V4a1 1 0 011-1h4M4 7v12a1 1 0 001 1h14a1 1 0 001-1V7M4 7h16"/></>}
              {i === 7 && <><circle cx="12" cy="18" r="4"/><line x1="12" y1="2" x2="12" y2="14"/><path d="M16 6l-4-4-4 4"/></>}
              {i === 8 && <><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>}
            </svg>
            <div className="arch-name">{m}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
