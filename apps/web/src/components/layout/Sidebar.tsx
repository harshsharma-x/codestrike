'use client';

import clsx from 'clsx';
import { useState, useEffect, useCallback } from 'react';
import { File, Search, Loader2, FileCode, FileJson, FileText } from 'lucide-react';

interface SearchResult {
  path: string;
  language: string;
  score: number;
  matches: string[];
  summary?: string;
}

function FileIcon({ name }: { name: string }) {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode size={14} className="text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-yellow-400" />;
  if (name.endsWith('.md')) return <FileText size={14} className="text-purple-400" />;
  return <File size={14} className="text-[var(--text-muted)]" />;
}

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'files' | 'search'>('files');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/projects/search?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <aside className="w-60 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col">
      <div className="flex items-center border-b border-[var(--border-primary)]">
        {(['files', 'search'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 px-4 py-2 text-xs font-medium transition-colors capitalize',
              activeTab === tab
                ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'files' && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--text-muted)]">
              <span>No files open</span>
            </div>
            <div className="px-2 py-1 text-xs text-[var(--text-muted)] italic">
              Open a file from the explorer or use the chat to get started.
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            {searching && (
              <div className="flex justify-center py-4">
                <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
              </div>
            )}
            {!searching && results.length === 0 && query && (
              <div className="text-xs text-[var(--text-muted)] px-2">No results found</div>
            )}
            {!searching && !query && (
              <div className="text-xs text-[var(--text-muted)] px-2">
                Search across your project files
              </div>
            )}
            <div className="space-y-0.5">
              {results.map((r, i) => (
                <div key={i} className="px-2 py-1.5 text-xs hover:bg-[var(--bg-tertiary)] rounded cursor-pointer">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <FileIcon name={r.path} />
                    <span className="truncate">{r.path}</span>
                  </div>
                  {r.summary && (
                    <div className="text-[var(--text-muted)] mt-0.5 truncate">{r.summary}</div>
                  )}
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Score: {r.score.toFixed(2)} &middot; {r.language}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-[var(--border-primary)]">
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          CodeStrike Ready
        </div>
      </div>
    </aside>
  );
}
