import { useEffect, useState } from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import Commands from './components/Commands';
import ProvidersSection from './components/ProvidersSection';
import StatsSection from './components/StatsSection';
import Architecture from './components/Architecture';
import Installation from './components/Installation';
import QuickStart from './components/QuickStart';
import CTA from './components/CTA';

const ICONS = {
  explorer: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
  files: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  git: 'M22 12h-4l-3 9L9 3l-3 9H2',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  github: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
};

function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

type Tab = 'features' | 'providers' | 'commands' | 'install' | 'quickstart' | 'docs';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('features');
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const sections = ['features', 'providers', 'commands', 'install', 'quickstart', 'get-started'];
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setActiveSection(e.target.id);
          if (sections.includes(e.target.id)) {
            setActiveTab(e.target.id as Tab);
          }
        }
      }
    }, { threshold: 0.2 });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-dots">
          <div className="title-bar-dot red" onClick={() => {}} />
          <div className="title-bar-dot yellow" />
          <div className="title-bar-dot green" />
        </div>
        <span className="title-bar-label">CodeStrike AI — Launch Terminal</span>
      </div>

      {/* Activity Bar */}
      <div className="activity-bar">
        <div className={`activity-btn ${activeSection === 'hero' ? 'active' : ''}`} onClick={() => scrollTo('hero')} title="Terminal">
          <Icon d={ICONS.files} size={22} />
        </div>
        <div className={`activity-btn ${activeTab === 'features' ? 'active' : ''}`} onClick={() => scrollTo('features')} title="Features">
          <Icon d={ICONS.explorer} size={22} />
        </div>
        <div className={`activity-btn ${activeTab === 'providers' ? 'active' : ''}`} onClick={() => scrollTo('providers')} title="Providers">
          <Icon d={ICONS.search} size={22} />
        </div>
        <div className={`activity-btn ${activeTab === 'commands' ? 'active' : ''}`} onClick={() => scrollTo('commands')} title="Commands">
          <Icon d={ICONS.settings} size={22} />
        </div>
        <div className="activity-btn activity-btn-bottom" onClick={() => scrollTo('get-started')} title="GitHub">
          <Icon d={ICONS.github} size={22} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 48, marginTop: 36, marginBottom: 22, flex: 1 }}>
        {/* Tab Bar */}
        <div className="tab-bar">
          {(['features', 'providers', 'commands', 'install', 'quickstart', 'docs'] as Tab[]).map(tab => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                scrollTo(tab === 'docs' ? 'get-started' : tab);
              }}
            >
              <Icon d={tab === 'features' ? ICONS.explorer : tab === 'providers' ? ICONS.search : tab === 'commands' ? ICONS.settings : tab === 'install' ? 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' : tab === 'quickstart' ? 'M4 17 10 11 4 5' : ICONS.git} size={14} />
              <span>{tab === 'docs' ? 'getting-started.tsx' : tab === 'quickstart' ? 'demo.sh' : `${tab}.ts`}</span>
              <span className="tab-close">✕</span>
            </div>
          ))}
        </div>

        {/* Hero */}
        <section id="hero">
          <Hero />
        </section>

        {/* Stats */}
        <StatsSection />

        {/* Features */}
        <section id="features">
          <Features />
        </section>

        {/* Providers */}
        <section id="providers">
          <ProvidersSection />
        </section>

        {/* Commands */}
        <section id="commands">
          <Commands />
        </section>

        {/* Install */}
        <section id="install">
          <Installation />
        </section>

        {/* Quick Start */}
        <section id="quickstart">
          <QuickStart />
        </section>

        {/* Architecture */}
        <Architecture />

        {/* CTA */}
        <section id="get-started">
          <CTA />
        </section>

        {/* Footer */}
        <div className="footer">
          <span>CodeStrike AI — MIT License</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="https://github.com/harshsharma-x/codestrike" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/harshsharma-x/codestrike/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contribute</a>
            <a href="https://github.com/harshsharma-x/codestrike/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">Security</a>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
          main
        </span>
        <span className="status-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          v0.1.0
        </span>
        <div className="status-right">
          <span className="status-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            MIT
          </span>
          <span className="status-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            108 tests passing
          </span>
          <span className="status-item" style={{ gap: 6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            All systems online
          </span>
        </div>
      </div>
    </div>
  );
}
