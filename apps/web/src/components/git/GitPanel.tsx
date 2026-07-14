'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, RefreshCw, GitCommit, Plus, FileCode, Loader2 } from 'lucide-react';

interface GitStatus {
  isRepo: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicts: string[];
}

interface CommitEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export default function GitPanel() {
  const [activeSection, setActiveSection] = useState<'changes' | 'history'>('changes');
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<CommitEntry[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/git/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch('/api/git/log');
      if (res.ok) {
        const data = await res.json();
        setCommits(data.log || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchStatus(), fetchLog()]).finally(() => setLoading(false));
  }, [fetchStatus, fetchLog]);

  const handleCommit = async () => {
    if (!commitMessage.trim() || committing) return;
    setCommitting(true);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage }),
      });
      if (res.ok) {
        setCommitMessage('');
        await Promise.all([fetchStatus(), fetchLog()]);
      }
    } catch { /* ignore */ } finally {
      setCommitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg-primary)] items-center justify-center">
        <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-[var(--accent-secondary)]" />
          <span className="text-sm font-medium">Source Control</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { fetchStatus(); fetchLog(); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center border-b border-[var(--border-primary)]">
        {(['changes', 'history'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex-1 px-4 py-1.5 text-xs font-medium transition-colors capitalize ${
              activeSection === section
                ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!status?.isRepo ? (
          <div className="text-xs text-[var(--text-muted)] text-center py-4">Not a git repository</div>
        ) : activeSection === 'changes' ? (
          <div className="space-y-1">
            {status.staged.length > 0 && (
              <>
                <div className="text-xs text-[var(--text-muted)] font-medium px-2 py-1">Staged</div>
                {status.staged.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-2 py-1 text-xs text-green-400">
                    <Plus size={12} /><FileCode size={12} /><span>{f}</span>
                  </div>
                ))}
              </>
            )}
            {status.unstaged.length > 0 && (
              <>
                <div className="text-xs text-[var(--text-muted)] font-medium px-2 py-1 mt-2">Modified</div>
                {status.unstaged.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-2 py-1 text-xs text-yellow-400">
                    <FileCode size={12} /><span>{f}</span>
                  </div>
                ))}
              </>
            )}
            {status.untracked.length > 0 && (
              <>
                <div className="text-xs text-[var(--text-muted)] font-medium px-2 py-1 mt-2">Untracked</div>
                {status.untracked.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)]">
                    <FileCode size={12} /><span>{f}</span>
                  </div>
                ))}
              </>
            )}
            {status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 && (
              <div className="text-xs text-[var(--text-muted)] text-center py-4">No changes detected</div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {commits.length === 0 && (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--text-muted)]">
                <GitCommit size={14} />
                <span>No commits yet</span>
              </div>
            )}
            {commits.map((commit) => (
              <div key={commit.hash} className="px-2 py-2 text-xs border border-[var(--border-primary)] rounded">
                <div className="text-[var(--text-primary)] font-mono">{commit.hash.slice(0, 7)}</div>
                <div className="text-[var(--text-secondary)] mt-1">{commit.message}</div>
                <div className="text-[var(--text-muted)] mt-1">{commit.author} &middot; {new Date(commit.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSection === 'changes' && (
        <div className="p-3 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
              placeholder="Commit message..."
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || committing}
              className="px-3 py-1.5 text-xs bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {committing ? '...' : 'Commit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
