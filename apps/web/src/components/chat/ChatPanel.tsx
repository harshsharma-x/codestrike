'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, StopCircle, Code } from 'lucide-react';
import { Message } from '@codestrike/shared';

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m CodeStrike AI. I can help you write, debug, and understand code. What are you working on?',
      timestamp: Date.now(),
      status: 'complete',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
      status: 'complete',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const assistantMessage: Message = {
      id: `msg-${Date.now()}-resp`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      let readerDone = false;
      while (!readerDone) {
        const { done, value } = await reader.read();
        if (done) { readerDone = true; break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const payload = JSON.parse(line);
            if (payload.content) accumulated += payload.content;
            if (payload.done) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: accumulated, status: 'complete' }
                    : m,
                ),
              );
              accumulated = '';
            } else {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: accumulated }
                    : m,
                ),
              );
            }
          } catch {
            accumulated += line;
          }
        }
      }

      if (accumulated) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: accumulated, status: 'complete' }
              : m,
          ),
        );
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.', status: 'error' }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 text-xs text-[var(--accent-secondary)]">
                  <Sparkles size={12} />
                  <span>CodeStrike AI</span>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              {message.status === 'streaming' && (
                <span className="inline-block w-2 h-4 ml-1 bg-[var(--accent-primary)] animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[var(--border-primary)]">
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] px-3 py-2">
          <button className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <Code size={16} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask CodeStrike to build, debug, or explain anything..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button className="p-1 text-red-400 hover:text-red-300">
              <StopCircle size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-1 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] disabled:text-[var(--text-muted)]"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-muted)]">
          <span>Use / for commands</span>
          <span>·</span>
          <span>Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
