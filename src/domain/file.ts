// Core entity. `data` is opaque per-type content the editors own — the domain
// never inspects it, keeping this module independent of any editor/vendor.
export type FileType = 'writer' | 'sheets' | 'slides';

export interface OfficeFile {
  readonly id: string;
  readonly type: FileType;
  readonly name: string;
  readonly data: unknown;
  readonly created: number;
  readonly modified: number;
}

export const FILE_TYPES: readonly FileType[] = ['writer', 'sheets', 'slides'];

export function isFileType(v: unknown): v is FileType {
  return typeof v === 'string' && (FILE_TYPES as readonly string[]).includes(v);
}

export function untitledName(type: FileType): string {
  return {
    writer: 'Untitled document',
    sheets: 'Untitled spreadsheet',
    slides: 'Untitled presentation',
  }[type];
}

// Minimal blank payloads. Real editors (M2+) replace these; here they just prove persistence.
export function blankData(type: FileType): unknown {
  switch (type) {
    case 'writer':
      return { html: '<h1>Untitled document</h1><p></p>' };
    case 'sheets':
      return { cells: {}, cols: 26, rows: 100 };
    case 'slides':
      return { slides: [{ bg: '#FFFFFF', els: [] }] };
  }
}
