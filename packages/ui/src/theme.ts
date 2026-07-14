export interface Theme {
  name: string;
  type: 'dark' | 'light';
  colors: {
    bg: { primary: string; secondary: string; tertiary: string };
    text: { primary: string; secondary: string; muted: string };
    accent: { primary: string; secondary: string; hover: string };
    border: { primary: string; secondary: string };
    syntax: {
      keyword: string;
      string: string;
      number: string;
      function: string;
      comment: string;
      variable: string;
      type: string;
    };
    terminal: {
      bg: string;
      text: string;
      prompt: string;
      error: string;
      success: string;
    };
    git: {
      added: string;
      deleted: string;
      modified: string;
      conflict: string;
    };
  };
}

export const DARK_THEME: Theme = {
  name: 'codestrike-dark',
  type: 'dark',
  colors: {
    bg: { primary: '#1e1e1e', secondary: '#252526', tertiary: '#2d2d2d' },
    text: { primary: '#cccccc', secondary: '#969696', muted: '#6e6e6e' },
    accent: { primary: '#0078d4', secondary: '#1ea7fd', hover: '#1c97ea' },
    border: { primary: '#3c3c3c', secondary: '#2d2d2d' },
    syntax: {
      keyword: '#569cd6',
      string: '#ce9178',
      number: '#b5cea8',
      function: '#dcdcaa',
      comment: '#6a9955',
      variable: '#9cdcfe',
      type: '#4ec9b0',
    },
    terminal: {
      bg: '#1e1e1e',
      text: '#4ec9b0',
      prompt: '#569cd6',
      error: '#f44747',
      success: '#4ec9b0',
    },
    git: {
      added: '#2ea043',
      deleted: '#f85149',
      modified: '#d29922',
      conflict: '#f85149',
    },
  },
};

export const LIGHT_THEME: Theme = {
  name: 'codestrike-light',
  type: 'light',
  colors: {
    bg: { primary: '#ffffff', secondary: '#f3f3f3', tertiary: '#e8e8e8' },
    text: { primary: '#333333', secondary: '#616161', muted: '#999999' },
    accent: { primary: '#0078d4', secondary: '#005a9e', hover: '#106ebe' },
    border: { primary: '#d4d4d4', secondary: '#e8e8e8' },
    syntax: {
      keyword: '#0000ff',
      string: '#a31515',
      number: '#098658',
      function: '#795e26',
      comment: '#008000',
      variable: '#001080',
      type: '#267f99',
    },
    terminal: {
      bg: '#ffffff',
      text: '#333333',
      prompt: '#0078d4',
      error: '#f44747',
      success: '#098658',
    },
    git: {
      added: '#2ea043',
      deleted: '#f85149',
      modified: '#d29922',
      conflict: '#f85149',
    },
  },
};

export function getTheme(type: 'dark' | 'light'): Theme {
  return type === 'dark' ? DARK_THEME : LIGHT_THEME;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const c = theme.colors;

  root.style.setProperty('--bg-primary', c.bg.primary);
  root.style.setProperty('--bg-secondary', c.bg.secondary);
  root.style.setProperty('--bg-tertiary', c.bg.tertiary);
  root.style.setProperty('--text-primary', c.text.primary);
  root.style.setProperty('--text-secondary', c.text.secondary);
  root.style.setProperty('--text-muted', c.text.muted);
  root.style.setProperty('--accent-primary', c.accent.primary);
  root.style.setProperty('--accent-secondary', c.accent.secondary);
  root.style.setProperty('--accent-hover', c.accent.hover);
  root.style.setProperty('--border-primary', c.border.primary);
  root.style.setProperty('--border-secondary', c.border.secondary);

  root.className = theme.type;
}
