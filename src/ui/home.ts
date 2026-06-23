import { el } from './dom';
import { icons } from './icons';
import type { FileType, OfficeFile } from '../domain/file';

const META: Record<FileType, { cls: string; icon: string; title: string; desc: string }> = {
  writer: { cls: 'w', icon: icons.writer, title: 'Document', desc: 'Word-style rich text writer' },
  sheets: { cls: 's', icon: icons.sheets, title: 'Spreadsheet', desc: 'Formula engine, live recalc' },
  slides: { cls: 'p', icon: icons.slides, title: 'Presentation', desc: 'Slides with a present mode' },
};

export interface HomeHandlers {
  files: OfficeFile[];
  onNew: (type: FileType) => void;
  onOpen: (file: OfficeFile) => void;
  onDelete: (file: OfficeFile) => void;
}

export function renderHome(h: HomeHandlers): HTMLElement {
  const newCard = (type: FileType): HTMLElement => {
    const m = META[type];
    return el('button', { class: `newcard ${m.cls}`, 'data-testid': `new-${type}`, onclick: () => h.onNew(type) }, [
      el('div', { class: 'ic', html: m.icon }),
      el('div', {}, [el('b', { text: m.title }), el('span', { text: m.desc })]),
    ]);
  };

  const recent = h.files.length
    ? h.files.map((f) => fileCard(f, h))
    : [el('div', { class: 'empty', text: 'No files yet. Create one above — everything stays on this device.' })];

  return el('div', { class: 'home', 'data-testid': 'home' }, [
    el('div', { class: 'home-in' }, [
      el('h1', { text: 'Keepvidya Office' }),
      el('p', { class: 'sub', text: 'A private, local-first, AI-native suite — Writer, Sheets, and Slides.' }),
      el('div', { class: 'priv', html: icons.shield + '<span>100% local · no account · no telemetry</span>' }),
      el('div', { class: 'sectlabel', text: 'Create new' }),
      el('div', { class: 'newgrid' }, [newCard('writer'), newCard('sheets'), newCard('slides')]),
      el('div', { class: 'sectlabel', text: `Recent files${h.files.length ? ` · ${h.files.length}` : ''}` }),
      el('div', { class: 'recent', 'data-testid': 'recent' }, recent),
    ]),
  ]);
}

function fileCard(f: OfficeFile, h: HomeHandlers): HTMLElement {
  const m = META[f.type];
  return el('div', { class: `fcard ${m.cls}`, 'data-testid': 'file-card', onclick: () => h.onOpen(f) }, [
    el('div', { class: 'thumb' }, [el('div', { class: 'ftype', html: m.icon })]),
    el('div', { class: 'meta' }, [el('b', { text: f.name }), el('small', { text: relTime(f.modified) })]),
    el('button', {
      class: 'del',
      html: '✕',
      title: 'Delete',
      'data-testid': 'file-delete',
      onclick: (e: Event) => {
        e.stopPropagation();
        if (confirm(`Delete “${f.name}”?`)) h.onDelete(f);
      },
    }),
  ]);
}

function relTime(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}
