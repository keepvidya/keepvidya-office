// Outbound ports — how the core reaches the world. Adapters implement these.
import type { OfficeFile } from './file';
import type { AiProviderConfig } from './ai-provider';
import type { SheetData } from './sheet/sheet';
import type { SlideDeck } from './slides/slides';
import type { DocData } from './doc/doc';

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

export interface ProviderSettingsPort {
  get(): AiProviderConfig;
  set(config: AiProviderConfig): void;
}

export interface ExportPort {
  xlsx(data: SheetData): Promise<Blob>;
  docx(data: DocData): Promise<Blob>;
  pptx(deck: SlideDeck): Promise<Blob>;
}
