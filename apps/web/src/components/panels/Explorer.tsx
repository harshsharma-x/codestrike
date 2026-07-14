'use client';

import { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, FileCode, FileJson, FileText, Loader2 } from 'lucide-react';

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

function FileIcon({ name }: { name: string }) {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode size={14} className="text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-yellow-400" />;
  if (name.endsWith('.md')) return <FileText size={14} className="text-purple-400" />;
  return <File size={14} className="text-[var(--text-muted)]" />;
}

function FileTree({ items, depth = 0 }: { items: TreeNode[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    const next = new Set(expanded);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpanded(next);
  };

  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <div key={item.name}>
          <button
            onClick={() => item.type === 'directory' && toggle(item.name)}
            className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {item.type === 'directory' ? (
              <>
                {expanded.has(item.name) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <Folder size={14} className="text-yellow-500" />
              </>
            ) : (
              <>
                <span className="w-3" />
                <FileIcon name={item.name} />
              </>
            )}
            <span>{item.name}</span>
          </button>
          {item.type === 'directory' && expanded.has(item.name) && item.children && (
            <FileTree items={item.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Explorer() {
  const [files, setFiles] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        const response = await fetch('/api/projects/structure');
        if (!response.ok) throw new Error('Failed to load files');
        const data = await response.json();
        const tree = data.tree?.children || data.tree || [];
        setFiles(Array.isArray(tree) ? tree : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <div className="px-4 py-2 border-b border-[var(--border-primary)]">
        <span className="text-xs font-medium uppercase text-[var(--text-muted)]">Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--text-muted)]">
            <Loader2 size={14} className="animate-spin" />
            Loading files...
          </div>
        )}
        {error && (
          <div className="px-4 py-2 text-xs text-red-400">{error}</div>
        )}
        {!loading && !error && files.length === 0 && (
          <div className="px-4 py-8 text-xs text-[var(--text-muted)] text-center">
            No files found
          </div>
        )}
        {!loading && !error && <FileTree items={files} />}
      </div>
    </div>
  );
}
