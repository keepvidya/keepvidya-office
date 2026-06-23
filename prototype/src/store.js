// Local-first persistence. Everything lives in the browser (localStorage) — no server,
// no account, no telemetry. This is the "ownership" wedge against MS Office / Google.
// Files are { id, type, name, data, created, modified }. `data` is editor-specific JSON.

const KEY = 'kvoffice:files:v1';
const THEME = 'kvoffice-theme';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function write(files) {
  localStorage.setItem(KEY, JSON.stringify(files));
}
function uid() {
  return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const store = {
  all() {
    return read().sort((a, b) => b.modified - a.modified);
  },
  get(id) {
    return read().find(f => f.id === id) || null;
  },
  create(type, name, data) {
    const files = read();
    const now = Date.now();
    const f = { id: uid(), type, name: name || untitled(type), data: data ?? {}, created: now, modified: now };
    files.push(f);
    write(files);
    return f;
  },
  update(id, patch) {
    const files = read();
    const f = files.find(x => x.id === id);
    if (!f) return null;
    Object.assign(f, patch, { modified: Date.now() });
    write(files);
    return f;
  },
  remove(id) {
    write(read().filter(f => f.id !== id));
  },
  // Theme is local too.
  theme(next) {
    if (next) { localStorage.setItem(THEME, next); document.documentElement.setAttribute('data-theme', next); }
    return localStorage.getItem(THEME) || 'light';
  },
};

export function untitled(type) {
  return ({ writer: 'Untitled document', sheets: 'Untitled spreadsheet', slides: 'Untitled presentation' })[type] || 'Untitled';
}

// Debounce helper for autosave.
export function debounce(fn, ms = 500) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); fn(...a); };
  return d;
}

// Trigger a browser download of text/blob content.
export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function relTime(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400);
  if (d < 7) return d + 'd ago';
  return new Date(ts).toLocaleDateString();
}
