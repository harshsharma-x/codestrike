import { useState } from 'react';

const METHODS = [
  {
    label: 'npm',
    cmd: 'npm install -g codestrike',
    desc: 'Install globally via npm — works on macOS, Linux, Windows.',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    label: 'curl',
    cmd: 'curl -fsSL https://raw.githubusercontent.com/harshsharma-x/codestrike/main/scripts/install.sh | bash',
    desc: 'One-liner — auto-detects your OS and installs everything.',
    icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8v4M12 16h.01',
  },
  {
    label: 'docker',
    cmd: 'docker pull ghcr.io/harshsharma-x/codestrike:latest',
    desc: 'Run in a container — no Node.js install needed.',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
  },
  {
    label: 'homebrew',
    cmd: 'brew install codestrike/tap/codestrike',
    desc: 'macOS users — install via Homebrew tap.',
    icon: 'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2',
  },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* fallback */ }
  };
  return (
    <button className="copy-btn" onClick={copy}>
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function Installation() {
  return (
    <div className="section" id="install">
      <div className="section-header">
        <div className="section-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          quickstart/install.sh
        </div>
        <div className="section-title">
          Install in <span className="highlight-green">one command</span>
        </div>
        <div className="section-subtitle">
          CodeStrike runs on macOS, Linux, and Windows. Choose your method:
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {METHODS.map((m, i) => (
          <div key={i} className="install-row fade-in visible" style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="install-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={m.icon}/></svg>
              {m.label}
            </div>
            <div className="install-cmd">
              <code>{m.cmd}</code>
              <CopyBtn text={m.cmd} />
            </div>
            <div className="install-desc">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
