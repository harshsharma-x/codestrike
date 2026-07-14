'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, Trash2, Wifi, WifiOff } from 'lucide-react';

function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = 'localhost:4000';
  return `${proto}//${host}/ws/terminal`;
}

export default function TerminalPanel() {
  const [output, setOutput] = useState<string[]>([
    'CodeStrike Terminal v0.1.0',
    'Type /help for commands',
    '',
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cmdIdRef = useRef(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setOutput(prev => [...prev, '[WS connected]']);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'connected') {
          setOutput(prev => [...prev, `CWD: ${msg.cwd}`]);
        } else if (msg.type === 'result') {
          if (msg.stdout) setOutput(prev => [...prev, msg.stdout]);
          if (msg.stderr) setOutput(prev => [...prev, `\x1b[31m${msg.stderr}\x1b[0m`]);
        } else if (msg.type === 'error') {
          setOutput(prev => [...prev, `Error: ${msg.message}`]);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connectWs]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const executeViaHttp = async (cmd: string) => {
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await response.json();
      if (data.stdout) setOutput(prev => [...prev, data.stdout]);
      if (data.stderr) setOutput(prev => [...prev, data.stderr]);
    } catch {
      setOutput(prev => [...prev, 'Command execution error']);
    }
  };

  const handleCommand = async () => {
    const cmd = input.trim();
    if (!cmd) return;

    setOutput(prev => [...prev, `$ ${cmd}`]);
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd === '/help') {
      setOutput(prev => [...prev, 'Commands: /help, /clear, /exit']);
    } else if (cmd === '/clear') {
      setOutput([]);
    } else if (cmd === '/exit') {
      setOutput(prev => [...prev, 'Goodbye!']);
    } else {
      cmdIdRef.current += 1;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ command: cmd, id: cmdIdRef.current }));
      } else {
        await executeViaHttp(cmd);
      }
    }

    setOutput(prev => [...prev, '']);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono text-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1a] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Terminal size={14} />
          <span className="text-xs">Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi size={12} className="text-green-400" />
          ) : (
            <WifiOff size={12} className="text-red-400" />
          )}
          <button
            onClick={() => { setOutput([]); }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {output.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      <div className="flex items-center px-3 py-2 border-t border-[#333]">
        <span className="mr-2 text-green-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-green-400 focus:outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}
