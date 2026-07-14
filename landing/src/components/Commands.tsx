const COMMANDS = [
  { name: 'init', desc: 'Initialize project' },
  { name: 'chat', desc: 'Interactive AI chat' },
  { name: 'explain', desc: 'Explain code' },
  { name: 'debug', desc: 'Debug errors' },
  { name: 'fix', desc: 'Fix bugs' },
  { name: 'test', desc: 'Generate tests' },
  { name: 'docs', desc: 'Generate docs' },
  { name: 'search', desc: 'Semantic search' },
  { name: 'review', desc: 'Code review' },
  { name: 'commit', desc: 'Commit messages' },
  { name: 'models', desc: 'List models' },
  { name: 'doctor', desc: 'System health' },
  { name: 'config', desc: 'Configuration' },
  { name: 'index', desc: 'Index project' },
  { name: 'status', desc: 'Project status' },
  { name: 'run', desc: 'Run commands' },
  { name: 'login', desc: 'API keys' },
  { name: 'terminal', desc: 'Terminal' },
  { name: 'session', desc: 'Sessions' },
  { name: 'providers', desc: 'Providers' },
  { name: 'agent', desc: 'Run agents' },
  { name: 'memory', desc: 'AI memory' },
  { name: 'plugins', desc: 'Plugins' },
  { name: 'update', desc: 'Check updates' },
];

export default function Commands() {
  return (
    <div className="section" id="commands">
      <div className="section-header">
        <div className="section-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
          codestrike --help
        </div>
        <div className="section-title">
          <span className="highlight-green">24</span> CLI Commands
        </div>
        <div className="section-subtitle">
          Every command you need for AI-powered development, all from the terminal.
        </div>
      </div>
      <div className="commands-grid">
        {COMMANDS.map((cmd, i) => (
          <div key={i} className="command-item fade-in visible" style={{ transitionDelay: `${i * 20}ms` }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {cmd.name}
          </div>
        ))}
      </div>
    </div>
  );
}
