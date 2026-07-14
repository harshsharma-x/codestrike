export const colors = {
  // Brand
  brand: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },

  // Syntax highlighting
  syntax: {
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    function: '#dcdcaa',
    comment: '#6a9955',
    variable: '#9cdcfe',
    type: '#4ec9b0',
    operator: '#d4d4d4',
  },

  // Status
  status: {
    success: '#4ec9b0',
    warning: '#dcdcaa',
    error: '#f44747',
    info: '#569cd6',
  },

  // Git
  git: {
    added: '#2ea043',
    deleted: '#f85149',
    modified: '#d29922',
    renamed: '#6c5ce7',
    conflict: '#f85149',
    untracked: '#6e6e6e',
  },

  // Terminal
  terminal: {
    black: '#1e1e1e',
    red: '#f44747',
    green: '#4ec9b0',
    yellow: '#dcdcaa',
    blue: '#569cd6',
    magenta: '#c586c0',
    cyan: '#4ec9b0',
    white: '#d4d4d4',
    brightBlack: '#6e6e6e',
    brightRed: '#f44747',
    brightGreen: '#4ec9b0',
    brightYellow: '#dcdcaa',
    brightBlue: '#569cd6',
    brightMagenta: '#c586c0',
    brightCyan: '#4ec9b0',
    brightWhite: '#ffffff',
  },

  // Diff
  diff: {
    insertBg: '#1b3a1b',
    insertBorder: '#2ea043',
    deleteBg: '#3a1b1b',
    deleteBorder: '#f85149',
    contextBg: '#1e1e1e',
  },
} as const;

export type ColorKey = keyof typeof colors;
