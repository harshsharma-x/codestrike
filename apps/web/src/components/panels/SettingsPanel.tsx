'use client';

import { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Monitor, Type, Loader2, Key, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

const PROVIDERS: { id: string; name: string; envKey: string; free: boolean }[] = [
  { id: 'openrouter', name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', free: true },
  { id: 'groq', name: 'Groq', envKey: 'GROQ_API_KEY', free: true },
  { id: 'huggingface', name: 'Hugging Face', envKey: 'HUGGINGFACE_API_KEY', free: true },
  { id: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY', free: false },
  { id: 'anthropic', name: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', free: false },
  { id: 'gemini', name: 'Gemini', envKey: 'GEMINI_API_KEY', free: true },
  { id: 'deepseek', name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', free: false },
  { id: 'mistral', name: 'Mistral', envKey: 'MISTRAL_API_KEY', free: false },
  { id: 'together', name: 'Together AI', envKey: 'TOGETHER_API_KEY', free: false },
];

interface AppConfig {
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  defaultProvider: string;
  defaultModel: string;
  gitIntegration: boolean;
  terminalIntegration: boolean;
  autoIndex: boolean;
  telemetry: boolean;
}

export default function SettingsPanel() {
  const [config, setConfig] = useState<AppConfig>({
    theme: 'dark',
    fontSize: 14,
    defaultProvider: 'openrouter',
    defaultModel: 'mistralai/mixtral-8x7b-instruct',
    gitIntegration: true,
    terminalIntegration: true,
    autoIndex: true,
    telemetry: false,
  });
  const [apiKeys, setApiKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.apiKeys) setApiKeys(data.apiKeys);
          if (data.configured) {
            setConfig(prev => ({ ...prev, ...data }));
          }
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const updateConfig = async (key: string, value: unknown) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const saveApiKey = async (provider: string) => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: keyInput.trim() }),
      });
      if (res.ok) {
        setApiKeys(prev => ({ ...prev, [provider]: true }));
        setKeySaved(keyInput.trim().slice(0, 8) + '...');
        setEditingKey(null);
        setKeyInput('');
        setTimeout(() => setKeySaved(''), 3000);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const themes = [
    { id: 'dark' as const, icon: Moon, label: 'Dark' },
    { id: 'light' as const, icon: Sun, label: 'Light' },
    { id: 'system' as const, icon: Monitor, label: 'System' },
  ];

  const toggles: { key: keyof AppConfig; label: string }[] = [
    { key: 'gitIntegration', label: 'Git Integration' },
    { key: 'terminalIntegration', label: 'Terminal Integration' },
    { key: 'autoIndex', label: 'Auto Indexing' },
    { key: 'telemetry', label: 'Telemetry' },
  ];

  if (loading) {
    return (
      <div className="flex h-full bg-[var(--bg-primary)] items-center justify-center">
        <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-primary)]">
        <span className="text-xs font-medium uppercase text-[var(--text-muted)]">Settings</span>
        {saving && <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Key size={14} className="text-[var(--accent-secondary)]" />
            API Keys
          </h3>
          <div className="space-y-1.5">
            {PROVIDERS.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between px-3 py-2 text-xs bg-[var(--bg-tertiary)] rounded">
                  <div className="flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.free && <span className="text-[10px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded">Free</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {apiKeys[p.id] ? (
                      <span className="flex items-center gap-1 text-green-400"><CheckCircle size={10} /> Set</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400"><XCircle size={10} /> Missing</span>
                    )}
                    <button
                      onClick={() => { setEditingKey(editingKey === p.id ? null : p.id); setKeyInput(''); setShowKey(false); }}
                      className="text-[var(--accent-primary)] hover:underline"
                    >
                      {editingKey === p.id ? 'Cancel' : apiKeys[p.id] ? 'Change' : 'Add'}
                    </button>
                  </div>
                </div>
                {editingKey === p.id && (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={keyInput}
                        onChange={e => setKeyInput(e.target.value)}
                        placeholder={`Paste your ${p.envKey}`}
                        className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-2 py-1.5 pr-8 focus:outline-none focus:border-[var(--accent-primary)]"
                        onKeyDown={e => e.key === 'Enter' && saveApiKey(p.id)}
                      />
                      <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                      >
                        {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <button
                      onClick={() => saveApiKey(p.id)}
                      disabled={!keyInput.trim() || saving}
                      className="text-xs px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {keySaved && (
            <p className="text-xs text-green-400 mt-2">Saved {keySaved}</p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Get a free key at{' '}
            <a href="https://openrouter.ai/keys" target="_blank" className="text-[var(--accent-primary)]">openrouter.ai/keys</a>
            {' '}or{' '}
            <a href="https://console.groq.com/keys" target="_blank" className="text-[var(--accent-primary)]">groq.com</a>
          </p>
        </section>

        <section>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sun size={14} className="text-[var(--accent-secondary)]" />
            Theme
          </h3>
          <div className="flex gap-2">
            {themes.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => updateConfig('theme', id)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 text-xs rounded border transition-colors',
                  config.theme === id
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]',
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Type size={14} className="text-[var(--accent-secondary)]" />
            Font Size
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={24}
              value={config.fontSize}
              onChange={(e) => updateConfig('fontSize', parseInt(e.target.value))}
              className="flex-1 accent-[var(--accent-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)] w-8 text-right">{config.fontSize}px</span>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium mb-3">Integrations</h3>
          <div className="space-y-2">
            {toggles.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between px-3 py-2 text-xs bg-[var(--bg-tertiary)] rounded">
                <span>{label}</span>
                <button
                  onClick={() => updateConfig(key, !config[key])}
                  className={`w-8 h-4 rounded-full relative transition-colors ${
                    config[key] ? 'bg-[var(--accent-primary)]' : 'bg-[#555]'
                  }`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                    config[key] ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
