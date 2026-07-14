'use client';

import { useState, useMemo } from 'react';
import { clsx } from 'clsx';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  fileName?: string;
}

const TOKENIZERS: Record<string, RegExp[]> = {
  typescript: [
    /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|new|throw|try|catch|finally|default|switch|case|break|continue|typeof|instanceof|in|of|this|super|yield|enum|static|private|public|protected|readonly|abstract|declare|namespace|module)\b/g,
    /\/\/.*/g, /\/\*[\s\S]*?\*\//g,
    /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g,
    /\b(\d+\.?\d*|0x[0-9a-fA-F]+)\b/g,
    /(\/\/.*)/g,
  ],
  python: [
    /\b(def|class|import|from|return|if|else|elif|for|while|try|except|finally|with|as|pass|break|continue|and|or|not|is|in|lambda|yield|raise|async|await|self|True|False|None)\b/g,
    /#.*/g, /'''[\s\S]*?'''|"""[\s\S]*?"""/g,
    /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g,
    /\b(\d+\.?\d*)\b/g,
  ],
  rust: [
    /\b(fn|let|mut|return|if|else|for|while|loop|match|struct|enum|impl|trait|pub|use|mod|crate|self|super|where|as|in|ref|move|async|await|unsafe|dyn|type|const|static|extern|macro_rules|true|false)\b/g,
    /\/\/.*/g, /\/\*[\s\S]*?\*\//g,
    /"([^"\\]|\\.)*"/g,
    /\b(\d+\.?\d*)\b/g,
  ],
  javascript: [
    /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|new|throw|try|catch|typeof|instanceof|this|super|yield|delete|switch|case|break|continue|default|extends|true|false|null|undefined)\b/g,
    /\/\/.*/g, /\/\*[\s\S]*?\*\//g,
    /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g,
    /\b(\d+\.?\d*)\b/g,
  ],
};

interface TokenSpan { text: string; className: string }

function tokenize(code: string, lang: string): TokenSpan[] {
  const spans: TokenSpan[] = [];
  const patterns = TOKENIZERS[lang] || TOKENIZERS.typescript;
  const combined = new RegExp(patterns.map(p => `(?:${p.source})`).join('|'), 'g');

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(code)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: code.slice(lastIndex, match.index), className: 'text-[#d4d4d4]' });
    }

    const full = match[0];
    const isKeyword = match[1] && patterns[0].test(full);
    const isComment = (match[2] || match[3]) && full.startsWith('/');
    const isString = match[4] && (full.startsWith('"') || full.startsWith("'") || full.startsWith('`'));
    const isNumber = match[5] && /^\d/.test(full);

    if (isKeyword) spans.push({ text: full, className: 'text-[#569cd6]' });
    else if (isComment) spans.push({ text: full, className: 'text-[#6a9955]' });
    else if (isString) spans.push({ text: full, className: 'text-[#ce9178]' });
    else if (isNumber) spans.push({ text: full, className: 'text-[#b5cea8]' });
    else spans.push({ text: full, className: 'text-[#d4d4d4]' });

    lastIndex = match.index + full.length;
  }

  if (lastIndex < code.length) {
    spans.push({ text: code.slice(lastIndex), className: 'text-[#d4d4d4]' });
  }

  return spans;
}

function highlightCode(code: string, lang: string): TokenSpan[][] {
  const lines = code.split('\n');
  return lines.map(line => tokenize(line, lang));
}

export default function CodeEditor({ value, onChange, language = 'typescript', readOnly = false, fileName }: CodeEditorProps) {
  const [lineCount] = useState(() => value.split('\n').length);
  const highlighted = useMemo(() => highlightCode(value, language), [value, language]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {fileName && (
        <div className="flex items-center px-4 py-1.5 bg-[#252526] border-b border-[#3c3c3c] text-xs text-[#969696]">
          <span className="text-[#cccccc]">{fileName}</span>
          {language && <span className="ml-2 px-1.5 py-0.5 bg-[#2d2d2d] rounded text-[10px]">{language}</span>}
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <div className="select-none text-right px-3 py-2 text-xs leading-5 text-[#6e6e6e] bg-[#1e1e1e] border-r border-[#3c3c3c] min-w-[48px]">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        {readOnly ? (
          <div className="flex-1 overflow-auto p-2 font-mono text-sm leading-5 whitespace-pre">
            {highlighted.map((line, li) => (
              <div key={li}>
                {line.length === 0 && <span className="text-[#d4d4d4]">{'\n'}</span>}
                {line.map((span, si) => (
                  <span key={si} className={span.className}>{span.text}</span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={clsx(
              'flex-1 bg-transparent text-sm leading-5 p-2 font-mono focus:outline-none resize-none',
              'text-[#d4d4d4] placeholder-[#6e6e6e]',
            )}
            spellCheck={false}
            style={{ tabSize: 2 }}
          />
        )}
      </div>
    </div>
  );
}
