// ThemePort backed by localStorage + the <html data-theme> attribute (the DOM "vendor").
import type { Theme, ThemePort } from '../../domain/ports';

const KEY = 'kvoffice-theme';

export function createDomTheme(): ThemePort {
  return {
    get(): Theme {
      return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
    },
    set(theme: Theme): void {
      localStorage.setItem(KEY, theme);
      document.documentElement.setAttribute('data-theme', theme);
    },
  };
}
