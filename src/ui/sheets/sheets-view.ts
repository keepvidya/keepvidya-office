// Sheets grid editor — model/view over the sheet domain. Builds the grid once and
// updates only changed cells' text/classes on each edit (DEV §9). DOM lives here
// (UI layer); all computation goes through domain/sheet + the M1 engine.
import { el } from '../dom';
import {
  type CellFmt,
  type SheetData,
  aggregate,
  cellsInRange,
  compute,
  setCell,
  setCellFormat,
  setCells,
} from '../../domain/sheet/sheet';
import { type CellResult, makeRef, numToCol } from '../../domain/formula';

const COLW = 96;
const HEADW = 46;

export interface SheetsHandlers {
  data: SheetData;
  onChange: (data: SheetData) => void;
  aiFill?: (prompt: string, data: SheetData) => Promise<{ data: SheetData; ok: boolean; note?: string }>;
}

export function renderSheets(h: SheetsHandlers): HTMLElement {
  let data = h.data;
  let results = compute(data);
  let active = { c: 1, r: 1 };
  let anchor = { c: 1, r: 1 };
  let editing = false;
  let dragging = false;
  const tdMap: Record<string, HTMLTableCellElement> = Object.create(null);
  const refOf = (a: { c: number; r: number }) => makeRef(a.c, a.r);
  const selRect = () => ({
    c1: Math.min(anchor.c, active.c),
    c2: Math.max(anchor.c, active.c),
    r1: Math.min(anchor.r, active.r),
    r2: Math.max(anchor.r, active.r),
  });

  /* formula bar */
  const nameBox = el('input', { class: 's-namebox', readonly: 'true', value: 'A1', 'data-testid': 'cell-name' }) as HTMLInputElement;
  const formInput = el('input', {
    class: 's-forminput',
    spellcheck: 'false',
    placeholder: 'Type a value or =formula',
    'data-testid': 'formula-input',
  }) as HTMLInputElement;
  formInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setRaw(refOf(active), formInput.value);
      moveActive(0, 1);
      focusGrid();
    } else if (e.key === 'Escape') {
      formInput.value = String(data.cells[refOf(active)] ?? '');
      focusGrid();
    }
  });
  const formBar = el('div', { class: 's-formbar' }, [nameBox, el('span', { class: 's-fx', text: 'ƒx' }), formInput]);

  /* toolbar */
  const boldBtn = el('button', { class: 'tb', title: 'Bold', html: '<b>B</b>', 'data-testid': 'fmt-bold', onclick: () => toggleFmt('b') }) as HTMLButtonElement;
  const italBtn = el('button', { class: 'tb', title: 'Italic', html: '<i>I</i>', 'data-testid': 'fmt-italic', onclick: () => toggleFmt('i') }) as HTMLButtonElement;
  const toolbar = el('div', { class: 'tbar' }, [
    el('div', { class: 'grp' }, [boldBtn, italBtn]),
    el('div', { class: 'grp' }, [el('button', { class: 'tb', title: 'Sum selection', html: '∑', 'data-testid': 'quick-sum', onclick: quickSum })]),
  ]);

  /* grid */
  const table = el('table', { class: 'grid', style: `width:${HEADW + COLW * data.cols}px` }) as HTMLTableElement;
  const colgroup = el('colgroup');
  colgroup.appendChild(el('col', { style: `width:${HEADW}px` }));
  for (let c = 1; c <= data.cols; c++) colgroup.appendChild(el('col', { style: `width:${COLW}px` }));
  table.appendChild(colgroup);

  const thead = el('thead');
  const htr = el('tr');
  htr.appendChild(el('th', { class: 'corner' }));
  for (let c = 1; c <= data.cols; c++) htr.appendChild(el('th', { class: 'collbl', 'data-c': c, text: numToCol(c) }));
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = el('tbody');
  for (let r = 1; r <= data.rows; r++) {
    const tr = el('tr');
    tr.appendChild(el('th', { class: 'rowlbl', 'data-r': r, text: r }));
    for (let c = 1; c <= data.cols; c++) {
      const ref = makeRef(c, r);
      const td = el('td', { 'data-ref': ref, 'data-c': c, 'data-r': r }) as HTMLTableCellElement;
      tdMap[ref] = td;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const editor = el('input', { class: 's-celledit', style: 'display:none' }) as HTMLInputElement;
  const scroll = el('div', { class: 's-grid-scroll', tabindex: '0', 'data-testid': 'grid' }, [table, editor]);
  const status = el('div', { class: 's-status', 'data-testid': 'sheet-status' });

  /* rendering */
  function renderValues(): void {
    for (const ref in tdMap) {
      const td = tdMap[ref];
      const v: CellResult | undefined = results[ref];
      td.className = '';
      if (v) {
        td.textContent = v.display;
        if (v.isError) td.classList.add('err');
        else if (v.isNumber) td.classList.add('num');
      } else {
        td.textContent = '';
      }
      const f = data.fmt?.[ref];
      if (f?.b) td.classList.add('bold');
      if (f?.i) td.classList.add('ital');
    }
    paintSelection();
  }
  function paintSelection(): void {
    table.querySelectorAll('td.sel,td.inrange').forEach((td) => td.classList.remove('sel', 'inrange'));
    table.querySelectorAll('th.active').forEach((th) => th.classList.remove('active'));
    const rect = selRect();
    for (let r = rect.r1; r <= rect.r2; r++)
      for (let c = rect.c1; c <= rect.c2; c++) tdMap[makeRef(c, r)]?.classList.add('inrange');
    tdMap[refOf(active)]?.classList.add('sel');
    htr.querySelector(`th[data-c="${active.c}"]`)?.classList.add('active');
    tbody.querySelector(`th[data-r="${active.r}"]`)?.classList.add('active');
    nameBox.value = refOf(active);
    formInput.value = String(data.cells[refOf(active)] ?? '');
    syncFmtButtons();
    renderStatus();
  }
  function syncFmtButtons(): void {
    const f = data.fmt?.[refOf(active)];
    boldBtn.classList.toggle('on', !!f?.b);
    italBtn.classList.toggle('on', !!f?.i);
  }
  function renderStatus(): void {
    const rect = selRect();
    const refs = cellsInRange(rect.c1, rect.r1, rect.c2, rect.r2);
    const agg = aggregate(results, refs);
    const single = refs.length === 1;
    const label = single ? refOf(active) : `${makeRef(rect.c1, rect.r1)}:${makeRef(rect.c2, rect.r2)}`;
    let right = '';
    if (agg.count > 0 && !single) {
      right = `Sum ${round(agg.sum)} · Avg ${round(agg.avg ?? 0)} · Count ${agg.count} · Min ${round(agg.min ?? 0)} · Max ${round(agg.max ?? 0)}`;
    } else if (agg.count > 0) {
      right = `Value ${round(agg.sum)}`;
    } else {
      const v = results[refOf(active)];
      right = v && v.display ? escapeText(v.display) : `Count ${agg.count}`;
    }
    status.innerHTML = `<span>${label}</span><span class="agg">${right}</span>`;
  }

  /* editing */
  function setRaw(ref: string, raw: string): void {
    data = setCell(data, ref, raw);
    results = compute(data);
    renderValues();
    h.onChange(data);
  }
  function toggleFmt(key: 'b' | 'i'): void {
    const rect = selRect();
    const refs = cellsInRange(rect.c1, rect.r1, rect.c2, rect.r2);
    const cur = data.fmt?.[refOf(active)];
    const next = !(cur && cur[key]);
    const patch: Partial<CellFmt> = key === 'b' ? { b: next } : { i: next };
    data = setCellFormat(data, refs, patch);
    renderValues();
    h.onChange(data);
    focusGrid();
  }
  function quickSum(): void {
    const rect = selRect();
    const singleCell = rect.c1 === rect.c2 && rect.r1 === rect.r2;
    if (singleCell) {
      const c = active.c;
      if (active.r <= 1 || data.cells[makeRef(c, active.r - 1)] == null) return; // nothing above
      let top = active.r - 1;
      while (top > 1 && data.cells[makeRef(c, top - 1)] != null) top--;
      setRaw(refOf(active), `=SUM(${makeRef(c, top)}:${makeRef(c, active.r - 1)})`);
    } else {
      const r = Math.min(rect.r2 + 1, data.rows);
      setRaw(makeRef(rect.c1, r), `=SUM(${makeRef(rect.c1, rect.r1)}:${makeRef(rect.c2, rect.r2)})`);
      setActive(rect.c1, r);
    }
    focusGrid();
  }
  function placeEditor(td: HTMLTableCellElement): void {
    const cr = scroll.getBoundingClientRect();
    const r = td.getBoundingClientRect();
    editor.style.left = `${r.left - cr.left + scroll.scrollLeft}px`;
    editor.style.top = `${r.top - cr.top + scroll.scrollTop}px`;
    editor.style.minWidth = `${r.width}px`;
    editor.style.height = `${r.height}px`;
  }
  function startEdit(initial?: string): void {
    const ref = refOf(active);
    editing = true;
    placeEditor(tdMap[ref]);
    editor.value = initial ?? String(data.cells[ref] ?? '');
    editor.style.display = '';
    editor.focus();
    if (initial != null) editor.setSelectionRange(editor.value.length, editor.value.length);
    else editor.select();
  }
  function commitEdit(dc: number, dr: number): void {
    if (!editing) return;
    setRaw(refOf(active), editor.value);
    editor.style.display = 'none';
    editing = false;
    focusGrid();
    if (dc || dr) moveActive(dc, dr);
    else paintSelection();
  }
  function cancelEdit(): void {
    editing = false;
    editor.style.display = 'none';
    focusGrid();
  }
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(0, e.shiftKey ? -1 : 1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit(e.shiftKey ? -1 : 1, 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
    e.stopPropagation();
  });
  editor.addEventListener('blur', () => {
    if (editing) commitEdit(0, 0);
  });

  /* navigation + selection */
  function setActive(c: number, r: number, extend = false): void {
    active = { c: clamp(c, 1, data.cols), r: clamp(r, 1, data.rows) };
    if (!extend) anchor = { ...active };
    ensureVisible(tdMap[refOf(active)]);
    paintSelection();
  }
  function moveActive(dc: number, dr: number, extend = false): void {
    setActive(active.c + dc, active.r + dr, extend);
  }
  function ensureVisible(td: HTMLTableCellElement | undefined): void {
    if (!td) return;
    const cr = scroll.getBoundingClientRect();
    const r = td.getBoundingClientRect();
    if (r.bottom > cr.bottom) scroll.scrollTop += r.bottom - cr.bottom + 4;
    if (r.top < cr.top + 24) scroll.scrollTop -= cr.top + 24 - r.top;
    if (r.right > cr.right) scroll.scrollLeft += r.right - cr.right + 4;
    if (r.left < cr.left + HEADW) scroll.scrollLeft -= cr.left + HEADW - r.left;
  }

  table.addEventListener('mousedown', (e) => {
    const td = (e.target as HTMLElement).closest('td');
    if (!td) return;
    if (editing) commitEdit(0, 0);
    setActive(Number(td.dataset.c), Number(td.dataset.r), (e as MouseEvent).shiftKey);
    dragging = true;
    focusGrid();
    e.preventDefault();
  });
  table.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const td = (e.target as HTMLElement).closest('td');
    if (!td) return;
    setActive(Number(td.dataset.c), Number(td.dataset.r), true);
  });
  scroll.addEventListener('mouseup', () => (dragging = false));
  scroll.addEventListener('mouseleave', () => (dragging = false));
  table.addEventListener('dblclick', (e) => {
    const td = (e.target as HTMLElement).closest('td');
    if (!td) return;
    setActive(Number(td.dataset.c), Number(td.dataset.r));
    startEdit();
  });
  // column / row header selection
  htr.addEventListener('click', (e) => {
    const th = (e.target as HTMLElement).closest('th.collbl');
    if (!th) return;
    const c = Number((th as HTMLElement).dataset.c);
    anchor = { c, r: 1 };
    setActive(c, data.rows, true);
  });
  tbody.addEventListener('click', (e) => {
    const th = (e.target as HTMLElement).closest('th.rowlbl');
    if (!th) return;
    const r = Number((th as HTMLElement).dataset.r);
    anchor = { c: 1, r };
    setActive(data.cols, r, true);
  });

  scroll.addEventListener('keydown', (e) => {
    if (editing) return;
    const k = e.key;
    const ext = e.shiftKey;
    if (k === 'ArrowUp') {
      e.preventDefault();
      moveActive(0, -1, ext);
    } else if (k === 'ArrowDown') {
      e.preventDefault();
      moveActive(0, 1, ext);
    } else if (k === 'Enter') {
      e.preventDefault();
      moveActive(0, 1);
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      moveActive(-1, 0, ext);
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      moveActive(1, 0, ext);
    } else if (k === 'Tab') {
      e.preventDefault();
      moveActive(1, 0);
    } else if (k === 'F2') {
      e.preventDefault();
      startEdit();
    } else if (k === 'Delete' || k === 'Backspace') {
      e.preventDefault();
      clearSelection();
    } else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'b') {
      e.preventDefault();
      toggleFmt('b');
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey && k.length === 1) {
      e.preventDefault();
      startEdit(k);
    }
  });
  scroll.addEventListener('paste', (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((line) => line.split('\t'));
    const writes: { ref: string; value: string }[] = [];
    rows.forEach((cols, ri) => cols.forEach((val, ci) => writes.push({ ref: makeRef(active.c + ci, active.r + ri), value: val })));
    data = setCells(data, writes);
    results = compute(data);
    renderValues();
    h.onChange(data);
  });
  function clearSelection(): void {
    const rect = selRect();
    const refs = cellsInRange(rect.c1, rect.r1, rect.c2, rect.r2);
    data = setCells(data, refs.map((ref) => ({ ref, value: '' })));
    results = compute(data);
    renderValues();
    h.onChange(data);
  }
  function focusGrid(): void {
    scroll.focus({ preventScroll: true });
  }

  /* optional AI prompt bar (narrator spine) */
  let aiBar: HTMLElement | null = null;
  if (h.aiFill) {
    const aiFill = h.aiFill;
    const promptInput = el('input', {
      class: 'ai-prompt',
      placeholder: 'Ask AI to fill this sheet… (e.g. a freelancer monthly budget)',
      'data-testid': 'ai-prompt',
    }) as HTMLInputElement;
    const note = el('span', { class: 'ai-note', 'data-testid': 'ai-note' });
    const genBtn = el('button', { class: 'ai-gen', text: 'Generate', 'data-testid': 'ai-generate' }) as HTMLButtonElement;
    const run = async (): Promise<void> => {
      const p = promptInput.value.trim();
      if (!p || genBtn.disabled) return;
      genBtn.disabled = true;
      genBtn.textContent = 'Generating…';
      note.textContent = '';
      try {
        const out = await aiFill(p, data);
        data = out.data;
        results = compute(data);
        renderValues();
        h.onChange(data);
        note.textContent = out.ok ? '✓ filled' : (out.note ?? 'No result');
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = 'Generate';
      }
    };
    genBtn.addEventListener('click', () => void run());
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void run();
    });
    aiBar = el('div', { class: 'ai-bar' }, [el('span', { class: 'ai-spark', text: '✦' }), promptInput, genBtn, note]);
  }

  const wrap = el('div', { class: 's-wrap' }, [aiBar, formBar, toolbar, scroll, status]);
  renderValues();
  setTimeout(focusGrid, 30);
  return wrap;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
function escapeText(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c);
}
