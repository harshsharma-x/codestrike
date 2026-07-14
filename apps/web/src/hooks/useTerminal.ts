'use client';

import { useState, useCallback, useRef } from 'react';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

export function useTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: 'CodeStrike Terminal v0.1.0', timestamp: Date.now() },
    { type: 'system', content: 'Type /help for commands', timestamp: Date.now() },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim() || isExecuting) return;

    setLines(prev => [...prev, { type: 'input', content: `$ ${command}`, timestamp: Date.now() }]);
    historyRef.current.push(command);
    historyIndexRef.current = -1;

    if (command === '/help') {
      setLines(prev => [...prev, {
        type: 'output',
        content: 'Commands: /help, /clear, /exit',
        timestamp: Date.now(),
      }]);
      return;
    }

    if (command === '/clear') {
      setLines([]);
      return;
    }

    if (command === '/exit') {
      setLines(prev => [...prev, {
        type: 'system',
        content: 'Goodbye!',
        timestamp: Date.now(),
      }]);
      return;
    }

    setIsExecuting(true);

    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (data.stdout) {
        setLines(prev => [...prev, {
          type: 'output',
          content: data.stdout,
          timestamp: Date.now(),
        }]);
      }
      if (data.stderr) {
        setLines(prev => [...prev, {
          type: 'error',
          content: data.stderr,
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setLines(prev => [...prev, {
        type: 'error',
        content: 'Command execution failed',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting]);

  const getPreviousCommand = useCallback((): string => {
    if (historyRef.current.length === 0) return '';
    if (historyIndexRef.current === -1) {
      historyIndexRef.current = historyRef.current.length - 1;
    } else {
      historyIndexRef.current = Math.max(0, historyIndexRef.current - 1);
    }
    return historyRef.current[historyIndexRef.current];
  }, []);

  const getNextCommand = useCallback((): string => {
    if (historyIndexRef.current === -1) return '';
    historyIndexRef.current++;
    if (historyIndexRef.current >= historyRef.current.length) {
      historyIndexRef.current = -1;
      return '';
    }
    return historyRef.current[historyIndexRef.current];
  }, []);

  return {
    lines,
    executeCommand,
    getPreviousCommand,
    getNextCommand,
    isExecuting,
  };
}
