// Outbound ports — how the core reaches the world. Adapters implement these.
import type { OfficeFile } from './file';

export interface StoragePort {
  put(file: OfficeFile): Promise<void>;
  getAll(): Promise<OfficeFile[]>;
  get(id: string): Promise<OfficeFile | null>;
  remove(id: string): Promise<void>;
}

export interface ClockPort {
  now(): number;
}

export interface IdPort {
  next(): string;
}

export type Theme = 'light' | 'dark';

export interface ThemePort {
  get(): Theme;
  set(theme: Theme): void;
}
