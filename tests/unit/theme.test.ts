import { describe, expect, it } from 'vitest';
import { currentTheme, toggleTheme } from '../../src/domain/theme';
import type { Theme, ThemePort } from '../../src/domain/ports';

function fakeTheme(initial: Theme = 'light'): ThemePort {
  let value: Theme = initial;
  return { get: () => value, set: (t) => (value = t) };
}

describe('TS-00.1 — theme (unit)', () => {
  it('TC-00.1.2 — theme store persists the choice', () => {
    const port = fakeTheme();
    // 1) default
    expect(currentTheme(port)).toBe('light');
    // 2) toggle to dark
    expect(toggleTheme(port)).toBe('dark');
    expect(currentTheme(port)).toBe('dark');
    // 3) toggle back to light
    expect(toggleTheme(port)).toBe('light');
    expect(currentTheme(port)).toBe('light');
  });
});
