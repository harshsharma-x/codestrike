'use client';

import { MessageSquare, FileCode, Terminal, GitBranch, Settings, Menu } from 'lucide-react';
import { clsx } from 'clsx';

type Panel = 'explorer' | 'chat' | 'terminal' | 'git' | 'settings';

interface HeaderProps {
  activePanel: Panel;
  onPanelChange: (panel: Panel) => void;
  onToggleSidebar: () => void;
  onOpenModelSelector: () => void;
}

const panelIcons: { id: Panel; icon: typeof MessageSquare; label: string }[] = [
  { id: 'explorer', icon: FileCode, label: 'Explorer' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'git', icon: GitBranch, label: 'Git' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function Header({ activePanel, onPanelChange, onToggleSidebar, onOpenModelSelector }: HeaderProps) {
  return (
    <header className="flex items-center h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-2 select-none">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
      >
        <Menu size={16} />
      </button>

      <div className="flex items-center ml-2 space-x-1">
        {panelIcons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onPanelChange(id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors',
              activePanel === id
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={onOpenModelSelector}
        className="flex items-center gap-1.5 px-3 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-tertiary)]"
      >
        <span className="w-2 h-2 rounded-full bg-green-500" />
        mixtral-8x7b
      </button>
    </header>
  );
}
