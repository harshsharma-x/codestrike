export default function StatsSection() {
  return (
    <div className="section" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <div className="stats-row">
        <div className="stat-card fade-in visible">
          <div className="stat-value">16</div>
          <div className="stat-label">AI Providers</div>
        </div>
        <div className="stat-card fade-in visible delay-1">
          <div className="stat-value">24</div>
          <div className="stat-label">CLI Commands</div>
        </div>
        <div className="stat-card fade-in visible delay-2">
          <div className="stat-value">10</div>
          <div className="stat-label">Agents</div>
        </div>
        <div className="stat-card fade-in visible delay-3">
          <div className="stat-value">100%</div>
          <div className="stat-label">Open Source</div>
        </div>
      </div>
    </div>
  );
}
