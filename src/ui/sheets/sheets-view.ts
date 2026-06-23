// Sheets grid editor — model/view over the sheet domain. Builds the grid once and
// updates only changed cells' text/classes on each edit (DEV §9). DOM lives here
// (UI layer); all computation goes through domain/sheet + the M1 engine.
import { el } from '../dom';
import { type SheetData, aggregate, compute, setCell } from '../../domain/sheet/sheet';
import { type CellResult, makeRef, numToCol } from '../../domain/formula';

const COLW = 96;
const HEADW = 46;

export interface SheetsHandlers {
  data: SheetData;
  onChange: (data: SheetData) => void;
}

export function renderSheets(h: SheetsHandlers): HTMLElement {
  let data = h.data;
  let results = compute(data);
  let active = { c: 1, r: 1 };
  let editing = false;
  const tdMap: Record<string, HTMLTableCellElement> = Object.create(null);
  const refOf = (a: { c: number; r: number }) => makeRef(a.c, a.r);

  /* formula bar */
  const nameBox = el('input', {
    class: 's-namebox',
    readonly: 'true',
    value: 'A1',
    'data-testid': 'cell-name',
  }) as HTMLInputElement;
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
  const formBar = el('div', { class: 's-formbar' }, [
    nameBox,
    el('span', { class: 's-fx', text: 'ƒx' }),
    formInput,
  ]);

  /* grid */
  const table = el('table', {
    class: 'grid',
    style: `width:${HEADW + COLW * data.cols}px`,
  }) as HTMLTableElement;
  const colgroup = el('colgroup');
  colgroup.appendChild(el('col', { style: `width:${HEADW}px` }));
  for (let c = 1; c <= data.cols; c++) colgroup.appendChild(el('col', { style: `width:${COLW}px` }));
  table.appendChild(colgroup);

  const thead = el('thead');
  const htr = el('tr');
  htr.appendChild(el('th', { class: 'corner' }));
  for (let c = 1; c <= data.cols; c++)
    htr.appendChild(el('th', { class: 'collbl', 'data-c': c, text: numToCol(c) }));
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
  const status = el('div', { class: 's-status' });

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
    }
    paintSelection();
  }
  function paintSelection(): void {
    table.querySelectorAll('td.sel').forEach((td) => td.classList.remove('sel'));
    htr.querySelectorAll('th.active').forEach((th) => th.classList.remove('active'));
    tbody.querySelectorAll('th.active').forEach((th) => th.classList.remove('active'));
    const ref = refOf(active);
    tdMap[ref]?.classList.add('sel');
    htr.querySelector(`th[data-c="${active.c}"]`)?.classList.add('active');
    tbody.querySelector(`th[data-r="${active.r}"]`)?.classList.add('active');
    nameBox.value = ref;
    formInput.value = String(data.cells[ref] ?? '');
    renderStatus();
  }
  function renderStatus(): void {
    const ref = refOf(active);
    const agg = aggregate(results, [ref]);
    const v = results[ref];
    const left = `<span>${ref}</span>`;
    const right = agg.count
      ? `<span class="agg">Value ${agg.sum}</span>`
      : v && v.display
        ? `<span class="agg">${escapeText(v.display)}</span>`
        : '';
    status.innerHTML = left + right;
  }

  /* editing */
  function setRaw(ref: string, raw: string): void {
    data = setCell(data, ref, raw);
    results = compute(data);
    renderValues();
    h.onChange(data);
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
    const td = tdMap[ref];
    editing = true;
    placeEditor(td);
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

  /* navigation */
  function setActive(c: number, r: number): void {
    active = { c: clamp(c, 1, data.cols), r: clamp(r, 1, data.rows) };
    ensureVisible(tdMap[refOf(active)]);
    paintSelection();
  }
  function moveActive(dc: number, dr: number): void {
    setActive(active.c + dc, active.r + dr);
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
    setActive(Number(td.dataset.c), Number(td.dataset.r));
    focusGrid();
    e.preventDefault();
  });
  table.addEventListener('dblclick', (e) => {
    const td = (e.target as HTMLElement).closest('td');
    if (!td) return;
    setActive(Number(td.dataset.c), Number(td.dataset.r));
    startEdit();
  });

  scroll.addEventListener('keydown', (e) => {
    if (editing) return;
    const k = e.key;
    if (k === 'ArrowUp') {
      e.preventDefault();
      moveActive(0, -1);
    } else if (k === 'ArrowDown' || k === 'Enter') {
      e.preventDefault();
      moveActive(0, 1);
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      moveActive(-1, 0);
    } else if (k === 'ArrowRight' || k === 'Tab') {
      e.preventDefault();
      moveActive(1, 0);
    } else if (k === 'F2') {
      e.preventDefault();
      startEdit();
    } else if (k === 'Delete' || k === 'Backspace') {
      e.preventDefault();
      setRaw(refOf(active), '');
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey && k.length === 1) {
      e.preventDefault(); // seed the char ourselves; don't let the browser also insert it
      startEdit(k);
    }
  });
  function focusGrid(): void {
    scroll.focus({ preventScroll: true });
  }

  const wrap = el('div', { class: 's-wrap' }, [formBar, scroll, status]);
  renderValues();
  setTimeout(focusGrid, 30);
  return wrap;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function escapeText(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c);
}
