// Document domain. A document is opaque HTML the editor owns; the domain only
// normalises it and counts words. Pure (no DOM/vendor).
export interface DocData {
  html: string;
}

const DEFAULT_HTML = '<h1>Untitled document</h1><p></p>';

export function normalizeDoc(data: unknown): DocData {
  const d = (data ?? {}) as { html?: unknown };
  return { html: typeof d.html === 'string' && d.html.trim() ? d.html : DEFAULT_HTML };
}

export function wordCount(text: string): number {
  const t = text.replace(/\s+/g, ' ').trim();
  return t ? t.split(' ').length : 0;
}
