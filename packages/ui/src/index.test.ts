import { describe, it, expect, vi } from 'vitest';
import { DARK_THEME, LIGHT_THEME, getTheme, applyTheme } from './theme';

describe('UI Theme', () => {
  it('should have dark theme defined', () => {
    expect(DARK_THEME.colors.bg.primary).toBe('#1e1e1e');
    expect(DARK_THEME.colors.text.primary).toBe('#cccccc');
    expect(DARK_THEME.colors.accent.primary).toBe('#0078d4');
  });

  it('should have light theme defined', () => {
    expect(LIGHT_THEME.colors.bg.primary).toBe('#ffffff');
    expect(LIGHT_THEME.colors.text.primary).toBe('#333333');
  });

  it('should return correct theme', () => {
    expect(getTheme('dark')).toBe(DARK_THEME);
    expect(getTheme('light')).toBe(LIGHT_THEME);
    expect(getTheme('system')).toBeDefined();
  });

  it('should apply theme to document', () => {
    const mockRoot = { style: { setProperty: vi.fn() }, className: '' };
    vi.stubGlobal('document', { documentElement: mockRoot });
    applyTheme(DARK_THEME);
    expect(mockRoot.style.setProperty).toHaveBeenCalled();
    expect(mockRoot.className).toBe('dark');
    vi.unstubAllGlobals();
  });
});
