'use client';

import { useState, useEffect } from 'react';
import { X, Check, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  free: boolean;
  local: boolean;
}

interface ModelSelectorProps {
  onClose: () => void;
}

export default function ModelSelector({ onClose }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selected, setSelected] = useState<string>('mixtral-8x7b');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          setModels(data.models || []);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, []);

  return (
    <div className="w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles size={14} className="text-[var(--accent-secondary)]" />
          Select Model
        </div>
        <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
          </div>
        )}
        {!loading && models.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] text-center py-4">No models available</div>
        )}
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => setSelected(model.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors',
              selected === model.id
                ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                : 'hover:bg-[var(--bg-tertiary)] border border-transparent',
            )}
          >
            <div className="flex-1">
              <div className="text-sm text-[var(--text-primary)]">{model.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{model.provider}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {model.local && (
                <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded">Local</span>
              )}
              {model.free && (
                <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">Free</span>
              )}
              {selected === model.id && (
                <Check size={14} className="text-[var(--accent-primary)]" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
