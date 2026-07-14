const PROVIDERS = [
  { name: 'OpenRouter', label: '100+ models', type: 'free' },
  { name: 'Groq', label: 'Fast inference', type: 'free' },
  { name: 'HuggingFace', label: 'Community models', type: 'free' },
  { name: 'Ollama', label: 'Local', type: 'free' },
  { name: 'LM Studio', label: 'Local', type: 'free' },
  { name: 'Gemini', label: 'Google', type: 'free' },
  { name: 'Nemotron', label: 'NVIDIA', type: 'free' },
  { name: 'DeepSeek', label: 'DeepSeek', type: 'paid' },
  { name: 'OpenAI', label: 'GPT-4o', type: 'paid' },
  { name: 'Anthropic', label: 'Claude', type: 'paid' },
  { name: 'Mistral', label: 'Mistral Large', type: 'paid' },
  { name: 'Together', label: 'Hosted OSS', type: 'paid' },
  { name: 'Cerebras', label: 'Wafer-scale', type: 'paid' },
  { name: 'Fireworks', label: 'Fast serving', type: 'paid' },
  { name: 'xAI', label: 'Grok', type: 'paid' },
  { name: 'GGUF', label: 'Local', type: 'free' },
];

export default function ProvidersSection() {
  return (
    <div className="section" id="providers">
      <div className="section-header">
        <div className="section-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg>
          packages/ai/src/providers/
        </div>
        <div className="section-title">
          <span className="highlight">16</span> AI Providers
        </div>
        <div className="section-subtitle">
          From free tiers to local models to premium APIs — CodeStrike speaks to every major LLM provider.
        </div>
      </div>
      <div className="providers-grid">
        {PROVIDERS.map((p, i) => (
          <span key={i} className={`provider-badge fade-in visible ${p.type}`} style={{ transitionDelay: `${i * 30}ms` }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {p.type === 'free'
                ? <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                : <path d="M20 7h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V9a2 2 0 00-2-2z" />
              }
            </svg>
            {p.name}
            <span style={{ opacity: 0.5 }}>{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
