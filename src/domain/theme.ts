// Pure theme decision logic over the ThemePort. DOM application lives in the adapter.
import type { Theme, ThemePort } from './ports';

export function currentTheme(port: ThemePort): Theme {
  return port.get();
}

export function toggleTheme(port: ThemePort): Theme {
  const next: Theme = port.get() === 'light' ? 'dark' : 'light';
  port.set(next);
  return next;
}
