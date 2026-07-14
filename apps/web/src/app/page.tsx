'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Explorer from '@/components/panels/Explorer';
import ChatPanel from '@/components/chat/ChatPanel';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import GitPanel from '@/components/git/GitPanel';
import SettingsPanel from '@/components/panels/SettingsPanel';
import ModelSelector from '@/components/chat/ModelSelector';
import Header from '@/components/layout/Header';

type Panel = 'explorer' | 'chat' | 'terminal' | 'git' | 'settings';

export default function Home() {
  const [activePanel, setActivePanel] = useState<Panel>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const renderPanel = () => {
    switch (activePanel) {
      case 'explorer': return <Explorer />;
      case 'chat': return <ChatPanel />;
      case 'terminal': return <TerminalPanel />;
      case 'git': return <GitPanel />;
      case 'settings': return <SettingsPanel />;
      default: return <ChatPanel />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenModelSelector={() => setShowModelSelector(!showModelSelector)}
        />
        <main className="flex-1 overflow-hidden">
          {renderPanel()}
        </main>
      </div>
      {showModelSelector && (
        <ModelSelector onClose={() => setShowModelSelector(false)} />
      )}
    </div>
  );
}
