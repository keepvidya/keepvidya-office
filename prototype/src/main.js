// Keepvidya Office — application shell: rail, launcher, routing, editor host.
import { store, untitled, relTime, debounce, downloadFile } from './store.js';
import { icons } from './icons.js';
import { mountWriter } from './writer.js';
import { mountSheets } from './sheets.js';
import { mountSlides } from './slides.js';

const root = document.getElementById('app');
let current = null; // active editor controller

/* ---------- tiny DOM helper ---------- */
export function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const k in props) {
    if (k === 'class') n.className = props[k];
    else if (k === 'html') n.innerHTML = props[k];
    else if (k === 'text') n.textContent = props[k];
    else if (k.startsWith('on') && typeof props[k] === 'function') n.addEventListener(k.slice(2).toLowerCase(), props[k]);
    else if (k === 'style') n.setAttribute('style', props[k]);
    else if (props[k] != null) n.setAttribute(k, props[k]);
  }
  for (const c of [].concat(kids)) if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return n;
}

export function toast(msg, ok = true) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = el('div', { class: 'toast', html: (ok ? icons.check : '') + `<span>${msg}</span>` });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); }, 2400);
}

/* ---------- rail ---------- */
function rail(active) {
  const mk = (id, ic, tip, onclick, isActive) =>
    el('button', { class: 'rbtn' + (isActive ? ' active' : ''), 'data-tip': tip, html: ic, onclick });
  const theme = store.theme();
  return el('div', { class: 'rail' }, [
    el('div', { class: 'logo', text: 'के', title: 'Keepvidya Office', onclick: () => go('#home') }),
    mk('home', icons.home, 'Home', () => go('#home'), active === 'home'),
    mk('writer', icons.writer, 'New document', () => create('writer'), active === 'writer'),
    mk('sheets', icons.sheets, 'New spreadsheet', () => create('sheets'), active === 'sheets'),
    mk('slides', icons.slides, 'New presentation', () => create('slides'), active === 'slides'),
    el('div', { class: 'sp' }),
    el('button', {
      class: 'rbtn', 'data-tip': theme === 'light' ? 'Dark mode' : 'Light mode',
      html: theme === 'light' ? icons.moon : icons.sun,
      onclick: () => { store.theme(store.theme() === 'light' ? 'dark' : 'light'); route(); }
    }),
  ]);
}

/* ---------- home / launcher ---------- */
function renderHome() {
  const files = store.all();
  const newCard = (cls, ic, title, desc) => el('button', { class: `newcard ${cls}`, onclick: () => create(({ w: 'writer', s: 'sheets', p: 'slides' })[cls]) }, [
    el('div', { class: 'ic', html: ic }),
    el('div', {}, [el('div', { class: 'new-tag', text: 'Blank' }), el('b', { text: title }), el('span', { text: desc })]),
  ]);

  const recentEls = files.length ? files.map(fileCard) : [el('div', { class: 'empty', text: 'No files yet. Create a document, spreadsheet, or presentation above — everything stays on this device.' })];

  const home = el('div', { class: 'home' }, [
    el('div', { class: 'home-in' }, [
      el('h1', { text: 'Keepvidya Office' }),
      el('p', { class: 'sub', text: 'A private, local-first suite — Writer, Sheets, and Slides. Your files live on your machine, not in someone else’s cloud.' }),
      el('div', { class: 'priv', html: icons.shield + '<span>100% local · no account · no telemetry</span>' }),
      el('div', { class: 'sectlabel', text: 'Create new' }),
      el('div', { class: 'newgrid' }, [
        newCard('w', icons.writer, 'Document', 'Word-style rich text writer'),
        newCard('s', icons.sheets, 'Spreadsheet', '70+ formula functions, live recalc'),
        newCard('p', icons.slides, 'Presentation', 'Slides with a present mode'),
      ]),
      el('div', { class: 'sectlabel', text: 'Templates' }),
      el('div', { class: 'newgrid' }, TEMPLATES.map(t => el('button', { class: `newcard ${({ writer: 'w', sheets: 's', slides: 'p' })[t.type]}`, onclick: () => createFromTemplate(t) }, [
        el('div', { class: 'ic', html: icons[t.type] }),
        el('div', {}, [el('div', { class: 'new-tag', text: 'Template' }), el('b', { text: t.name }), el('span', { text: t.desc })]),
      ]))),
      el('div', { class: 'sectlabel', text: `Recent files${files.length ? ` · ${files.length}` : ''}` }),
      el('div', { class: 'recent' }, recentEls),
    ]),
  ]);
  return home;
}

function fileCard(f) {
  const cls = ({ writer: 'w', sheets: 's', slides: 'p' })[f.type];
  const thumb = el('div', { class: 'thumb' }, thumbLines(f));
  thumb.appendChild(el('div', { class: 'ftype', html: icons[f.type] }));
  const card = el('div', { class: `fcard ${cls}`, onclick: () => go(`#${f.type}/${f.id}`) }, [
    thumb,
    el('div', { class: 'meta' }, [el('b', { text: f.name }), el('small', { text: relTime(f.modified) })]),
    el('button', { class: 'del', html: '✕', title: 'Delete', onclick: (e) => { e.stopPropagation(); if (confirm(`Delete “${f.name}”? This cannot be undone.`)) { store.remove(f.id); route(); } } }),
  ]);
  return card;
}
function thumbLines(f) {
  const out = [];
  const widths = [70, 88, 60, 80, 52];
  for (let i = 0; i < 5; i++) out.push(el('div', { class: 'tline', style: `top:${16 + i * 16}px;left:14px;width:${widths[i]}%` }));
  return out;
}

/* ---------- editor host ---------- */
function renderEditor(type, id) {
  const file = store.get(id);
  if (!file) { go('#home'); return el('div'); }

  const saved = el('span', { class: 'saved', html: '<span class="dot"></span>Saved locally' });
  const title = el('input', { class: 'title', value: file.name, spellcheck: 'false' });
  title.addEventListener('input', () => { store.update(file.id, { name: title.value || untitled(type) }); });

  const host = el('div', { class: 'ed' });
  const body = el('div', { style: 'flex:1;min-height:0;display:flex;flex-direction:column' });

  const ctx = {
    file,
    save: debounce((data) => { saved.classList.add('saving'); saved.querySelector('span').nextSibling.textContent = 'Saving…'; store.update(file.id, { data }); setTimeout(() => { saved.classList.remove('saving'); saved.innerHTML = '<span class="dot"></span>Saved locally'; }, 250); }, 500),
    saveNow: (data) => store.update(file.id, { data }),
    toast, downloadFile, el,
  };

  const exportWrap = el('div', { class: 'menuwrap' });
  const exportBtn = el('button', { class: 'btn ghost sm', html: icons.download + 'Export', onclick: () => menu.classList.toggle('on') });
  const menu = el('div', { class: 'menu' });
  exportWrap.append(exportBtn, menu);

  const topRight = el('div', { style: 'display:flex;gap:8px;align-items:center' });

  const edbar = el('div', { class: 'edbar' }, [
    el('button', { class: 'back', html: icons.back, title: 'All files', onclick: () => go('#home') }),
    el('span', { class: 'ftype-dot', style: `background:var(--${type})` }),
    title, saved, el('div', { class: 'sp' }), topRight,
  ]);
  host.append(edbar, body);

  // mount the editor module
  const mounters = { writer: mountWriter, sheets: mountSheets, slides: mountSlides };
  current = mounters[type](body, file, ctx);

  // build export menu from the editor's declared exporters
  menu.appendChild(el('div', { class: 'mh', text: 'Download a copy' }));
  for (const ex of current.exports || []) {
    menu.appendChild(el('button', { class: 'mi', html: (ex.icon || icons.download) + ex.label + (ex.hint ? `<small>${ex.hint}</small>` : ''), onclick: () => { menu.classList.remove('on'); ex.run(); } }));
  }
  document.addEventListener('click', (e) => { if (!exportWrap.contains(e.target)) menu.classList.remove('on'); });

  if (current.onPresent) topRight.appendChild(el('button', { class: 'btn sm', html: icons.present + 'Present', onclick: () => current.onPresent() }));
  topRight.appendChild(exportWrap);

  return host;
}

/* ---------- file creation ---------- */
function create(type) {
  const f = store.create(type, untitled(type), blankData(type));
  go(`#${type}/${f.id}`);
}
function createFromTemplate(t) {
  const f = store.create(t.type, t.name, structuredClone(t.data));
  go(`#${t.type}/${f.id}`);
}
function blankData(type) {
  if (type === 'writer') return { html: '<h1>Untitled document</h1><p>Start writing…</p>' };
  if (type === 'sheets') return { cells: {}, cols: 26, rows: 100, fmt: {} };
  if (type === 'slides') return { slides: [{ els: [{ type: 'text', x: 80, y: 150, w: 800, h: 120, html: 'Click to add a title', size: 48, bold: true, color: '#1B2A33', align: 'center' }], bg: '#FFFFFF' }] };
}

/* ---------- routing ---------- */
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
function parseHash() {
  const h = (location.hash || '#home').slice(1);
  const [type, id] = h.split('/');
  return { type, id };
}
function route() {
  if (current && current.destroy) { try { current.destroy(); } catch {} current = null; }
  const { type, id } = parseHash();
  root.innerHTML = '';
  root.removeAttribute('aria-busy');
  if (['writer', 'sheets', 'slides'].includes(type) && id) {
    root.append(rail(type), el('div', { class: 'main' }, [renderEditor(type, id)]));
  } else {
    root.append(rail('home'), el('div', { class: 'main' }, [renderHome()]));
  }
}
window.addEventListener('hashchange', route);

/* ---------- templates ---------- */
const TEMPLATES = [
  {
    type: 'writer', name: 'Business letter', desc: 'Formal letter layout',
    data: { html: '<p style="text-align:right">Keepvidya Pvt. Ltd.<br>123 Vidya Marg<br>Bengaluru, India</p><p>June 23, 2026</p><p>Dear [Recipient],</p><p>I am writing to…</p><p>Thank you for your time and consideration.</p><p>Sincerely,<br><br>[Your name]</p>' }
  },
  {
    type: 'sheets', name: 'Monthly budget', desc: 'Income vs. expenses with totals',
    data: { cols: 26, rows: 100, fmt: { A1: { b: 1 }, B1: { b: 1 }, A8: { b: 1 }, B8: { b: 1 } }, cells: { A1: 'Category', B1: 'Amount', A2: 'Salary', B2: '4500', A3: 'Freelance', B3: '800', A4: 'Rent', B4: '-1500', A5: 'Groceries', B5: '-600', A6: 'Transport', B6: '-220', A7: 'Savings', B7: '-500', A8: 'Net', B8: '=SUM(B2:B7)' } }
  },
  {
    type: 'sheets', name: 'Invoice', desc: 'Line items, qty × price, tax',
    data: { cols: 26, rows: 100, fmt: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 } }, cells: { A1: 'Item', B1: 'Qty', C1: 'Price', D1: 'Total', A2: 'Consulting', B2: '10', C2: '120', D2: '=B2*C2', A3: 'Design', B3: '4', C3: '200', D3: '=B3*C3', A5: 'Subtotal', D5: '=SUM(D2:D4)', A6: 'Tax 18%', D6: '=D5*0.18', A7: 'Total', D7: '=D5+D6' } }
  },
  {
    type: 'slides', name: 'Pitch deck', desc: 'Title + agenda starter',
    data: {
      slides: [
        { bg: '#1B2A33', els: [{ type: 'text', x: 90, y: 200, w: 780, h: 110, html: 'Your Big Idea', size: 60, bold: true, color: '#FBF8F3', align: 'center' }, { type: 'text', x: 90, y: 320, w: 780, h: 50, html: 'A one-line description of what you do', size: 24, color: '#C0703C', align: 'center' }] },
        { bg: '#FFFFFF', els: [{ type: 'text', x: 70, y: 60, w: 820, h: 70, html: 'Agenda', size: 40, bold: true, color: '#1B2A33', align: 'left' }, { type: 'text', x: 70, y: 170, w: 820, h: 300, html: '1. The problem<br>2. Our solution<br>3. Market &amp; traction<br>4. Business model<br>5. The ask', size: 28, color: '#33474F', align: 'left' }] },
      ]
    }
  },
];

route();
