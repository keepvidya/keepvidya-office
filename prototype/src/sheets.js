// Keepvidya Office — Sheets (spreadsheet grid on top of the formula engine).
import { icons } from './icons.js';
import { el, toast } from './main.js';
import { downloadFile } from './store.js';
import { recalc, numToCol, colToNum, makeRef, parseRef, FUNCTION_NAMES } from './formula.js';

export function mountSheets(host, file, ctx) {
  const D = normalize(file.data);
  let active = { c: 1, r: 1 };
  let sel = { c1: 1, r1: 1, c2: 1, r2: 1 };
  let values = recalc(D.cells);
  let editing = false;
  const tdMap = Object.create(null);

  /* ---- formula bar ---- */
  const nameBox = el('input', { class: 's-namebox', readonly: 'true', value: 'A1' });
  const formInput = el('input', { class: 's-forminput', spellcheck: 'false', placeholder: 'Type a value or =formula' });
  formInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); setRaw(refOf(active), formInput.value); moveActive(0, 1); focusGrid(); }
    else if (e.key === 'Escape') { formInput.value = D.cells[refOf(active)] || ''; focusGrid(); }
  });
  const formBar = el('div', { class: 's-formbar' }, [nameBox, el('span', { class: 's-fx', text: 'ƒx' }), formInput]);

  /* ---- toolbar ---- */
  const tbBtn = (ic, title, on, tog) => el('button', { class: 'tb', title, html: ic, 'data-tog': tog || null, onclick: on });
  const fnSel = el('select', { class: 'tbsel', title: 'Insert function' }, [optionEl('', 'ƒ Insert function')].concat(
    ['SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX', 'IF', 'ROUND', 'VLOOKUP', 'COUNTIF', 'SUMIF', 'CONCAT', 'TODAY'].map(f => optionEl(f, f))));
  fnSel.addEventListener('change', () => { if (fnSel.value) { startEdit('=' + fnSel.value + '('); fnSel.value = ''; } });
  const toolbar = el('div', { class: 'tbar' }, [
    el('div', { class: 'grp' }, [
      tbBtn(icons.bold, 'Bold', () => toggleFmt('b'), 'b'),
      tbBtn(icons.italic, 'Italic', () => toggleFmt('i'), 'i'),
    ]),
    el('div', { class: 'grp' }, [
      el('button', { class: 'tb', title: 'Sum selected', html: '∑', onclick: quickSum }),
      fnSel,
    ]),
    el('div', { class: 'grp' }, [
      tbBtn(icons.trash, 'Clear cell(s)', clearSel),
    ]),
  ]);

  /* ---- grid ---- */
  const COLW = 96, ROWH = 25, HEADW = 46;
  const table = el('table', { class: 'grid', style: `width:${HEADW + COLW * D.cols}px` });
  const colgroup = el('colgroup');
  colgroup.appendChild(el('col', { style: `width:${HEADW}px` }));
  for (let c = 1; c <= D.cols; c++) colgroup.appendChild(el('col', { style: `width:${COLW}px` }));
  table.appendChild(colgroup);

  const thead = el('thead');
  const htr = el('tr');
  htr.appendChild(el('th', { class: 'corner' }));
  for (let c = 1; c <= D.cols; c++) htr.appendChild(el('th', { class: 'collbl', 'data-c': c, text: numToCol(c) }));
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = el('tbody');
  for (let r = 1; r <= D.rows; r++) {
    const tr = el('tr');
    tr.appendChild(el('th', { class: 'rowlbl', 'data-r': r, text: r }));
    for (let c = 1; c <= D.cols; c++) {
      const ref = makeRef(c, r);
      const td = el('td', { 'data-ref': ref, 'data-c': c, 'data-r': r });
      tdMap[ref] = td;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const editor = el('input', { class: 's-celledit', style: 'display:none' });
  const scroll = el('div', { class: 's-grid-scroll', tabindex: '0' }, [table, editor]);

  /* ---- status + tabs ---- */
  const status = el('div', { class: 's-status' });
  const tabs = el('div', { class: 's-tabs' }, [el('div', { class: 's-tab on', text: 'Sheet 1' }), el('button', { class: 's-tab', html: '+', title: 'More sheets — coming with the Univer engine', onclick: () => toast('Multi-sheet ships with the Univer engine upgrade') })]);

  host.append(formBar, toolbar, el('div', { class: 's-wrap' }, [scroll]), status, tabs);

  /* ---- rendering ---- */
  function refOf(a) { return makeRef(a.c, a.r); }
  function renderValues() {
    for (const ref in tdMap) {
      const td = tdMap[ref];
      const v = values[ref];
      const f = D.fmt[ref];
      td.className = '';
      if (f) { if (f.b) td.classList.add('bold'); if (f.i) td.classList.add('ital'); }
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
  function paintSelection() {
    table.querySelectorAll('td.sel,td.inrange').forEach(td => td.classList.remove('sel', 'inrange'));
    table.querySelectorAll('th.active').forEach(th => th.classList.remove('active'));
    const { c1, r1, c2, r2 } = norm(sel);
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const td = tdMap[makeRef(c, r)];
      if (!td) continue;
      td.classList.add((c === active.c && r === active.r) ? 'sel' : 'inrange');
    }
    tdMap[refOf(active)]?.classList.add('sel');
    htr.querySelector(`th[data-c="${active.c}"]`)?.classList.add('active');
    tbody.querySelector(`th[data-r="${active.r}"]`)?.classList.add('active');
    nameBox.value = refOf(active);
    formInput.value = D.cells[refOf(active)] || '';
    syncFmtToggles();
    renderStatus();
  }
  function renderStatus() {
    const { c1, r1, c2, r2 } = norm(sel);
    const nums = [];
    let count = 0;
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const v = values[makeRef(c, r)];
      if (v && v.display !== '') { count++; if (v.isNumber) nums.push(v.value); }
    }
    let agg = `<span>${refOf({ c: c1, r: r1 })}${(c1 !== c2 || r1 !== r2) ? ':' + makeRef(c2, r2) : ''}</span>`;
    const aggR = nums.length
      ? `<span>Sum ${round(nums.reduce((s, n) => s + n, 0))}</span><span>Avg ${round(nums.reduce((s, n) => s + n, 0) / nums.length)}</span><span>Count ${count}</span><span>Min ${round(Math.min(...nums))}</span><span>Max ${round(Math.max(...nums))}</span>`
      : `<span>Count ${count}</span>`;
    status.innerHTML = agg + `<span class="agg">${aggR}</span>`;
  }
  function syncFmtToggles() {
    const f = D.fmt[refOf(active)] || {};
    toolbar.querySelector('[data-tog="b"]').classList.toggle('on', !!f.b);
    toolbar.querySelector('[data-tog="i"]').classList.toggle('on', !!f.i);
  }

  /* ---- editing ---- */
  function setRaw(ref, raw) {
    if (raw === '' || raw == null) delete D.cells[ref]; else D.cells[ref] = raw;
    values = recalc(D.cells);
    renderValues();
    ctx.save(D);
  }
  function startEdit(initial) {
    const ref = refOf(active);
    const td = tdMap[ref];
    editing = true;
    place(editor, td);
    editor.value = initial != null ? initial : (D.cells[ref] || '');
    editor.style.display = '';
    editor.focus();
    if (initial != null) editor.setSelectionRange(editor.value.length, editor.value.length);
    else editor.select();
  }
  function commitEdit(dc, dr) {
    if (!editing) return;
    setRaw(refOf(active), editor.value);
    editor.style.display = 'none';
    editing = false;
    focusGrid();
    if (dc || dr) moveActive(dc, dr); else paintSelection();
  }
  function cancelEdit() { editing = false; editor.style.display = 'none'; focusGrid(); }
  function place(node, td) {
    const cr = scroll.getBoundingClientRect();
    const r = td.getBoundingClientRect();
    node.style.left = (r.left - cr.left + scroll.scrollLeft) + 'px';
    node.style.top = (r.top - cr.top + scroll.scrollTop) + 'px';
    node.style.minWidth = r.width + 'px';
    node.style.height = r.height + 'px';
  }
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(0, e.shiftKey ? -1 : 1); }
    else if (e.key === 'Tab') { e.preventDefault(); commitEdit(e.shiftKey ? -1 : 1, 0); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
    e.stopPropagation();
  });
  editor.addEventListener('blur', () => { if (editing) commitEdit(0, 0); });

  /* ---- navigation + selection ---- */
  function setActive(c, r, keepSel) {
    active = { c: clamp(c, 1, D.cols), r: clamp(r, 1, D.rows) };
    if (!keepSel) sel = { c1: active.c, r1: active.r, c2: active.c, r2: active.r };
    else { sel.c2 = active.c; sel.r2 = active.r; }
    ensureVisible(tdMap[refOf(active)]);
    paintSelection();
  }
  function moveActive(dc, dr) { setActive(active.c + dc, active.r + dr, false); }
  function ensureVisible(td) {
    if (!td) return;
    const cr = scroll.getBoundingClientRect(), r = td.getBoundingClientRect();
    if (r.bottom > cr.bottom) scroll.scrollTop += r.bottom - cr.bottom + 4;
    if (r.top < cr.top + 24) scroll.scrollTop -= (cr.top + 24) - r.top;
    if (r.right > cr.right) scroll.scrollLeft += r.right - cr.right + 4;
    if (r.left < cr.left + 46) scroll.scrollLeft -= (cr.left + 46) - r.left;
  }

  let dragging = false;
  table.addEventListener('mousedown', (e) => {
    const td = e.target.closest('td'); if (!td) return;
    if (editing) commitEdit(0, 0);
    const c = +td.dataset.c, r = +td.dataset.r;
    setActive(c, r, e.shiftKey);
    dragging = true;
    focusGrid();
    e.preventDefault();
  });
  table.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const td = e.target.closest('td'); if (!td) return;
    active = { c: +td.dataset.c, r: +td.dataset.r };
    sel.c2 = active.c; sel.r2 = active.r;
    paintSelection();
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  table.addEventListener('dblclick', (e) => { const td = e.target.closest('td'); if (td) { setActive(+td.dataset.c, +td.dataset.r); startEdit(); } });
  // select whole column / row from headers
  htr.addEventListener('click', (e) => { const th = e.target.closest('th.collbl'); if (!th) return; const c = +th.dataset.c; active = { c, r: 1 }; sel = { c1: c, r1: 1, c2: c, r2: D.rows }; paintSelection(); });
  tbody.addEventListener('click', (e) => { const th = e.target.closest('th.rowlbl'); if (!th) return; const r = +th.dataset.r; active = { c: 1, r }; sel = { c1: 1, r1: r, c2: D.cols, r2: r }; paintSelection(); });

  function onKey(e) {
    if (editing) return;
    const k = e.key;
    if (k === 'ArrowUp') { e.preventDefault(); setActive(active.c, active.r - 1, e.shiftKey); }
    else if (k === 'ArrowDown') { e.preventDefault(); setActive(active.c, active.r + 1, e.shiftKey); }
    else if (k === 'ArrowLeft') { e.preventDefault(); setActive(active.c - 1, active.r, e.shiftKey); }
    else if (k === 'ArrowRight' || k === 'Tab') { e.preventDefault(); setActive(active.c + 1, active.r, k === 'Tab' ? false : e.shiftKey); }
    else if (k === 'Enter') { e.preventDefault(); startEdit(); }
    else if (k === 'F2') { e.preventDefault(); startEdit(); }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); clearSel(); }
    else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'c') { copySel(); }
    else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'v') { /* paste handled by paste event */ }
    else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'b') { e.preventDefault(); toggleFmt('b'); }
    else if (!e.ctrlKey && !e.metaKey && !e.altKey && k.length === 1) { startEdit(k); }
  }
  scroll.addEventListener('keydown', onKey);
  scroll.addEventListener('paste', (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map(line => line.split('\t'));
    rows.forEach((cols, ri) => cols.forEach((val, ci) => { const ref = makeRef(active.c + ci, active.r + ri); if (val === '') delete D.cells[ref]; else D.cells[ref] = val; }));
    values = recalc(D.cells); renderValues(); ctx.save(D); toast(`Pasted ${rows.length}×${rows[0].length}`);
  });
  function focusGrid() { scroll.focus({ preventScroll: true }); }

  /* ---- ops ---- */
  function clearSel() { const { c1, r1, c2, r2 } = norm(sel); for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) delete D.cells[makeRef(c, r)]; values = recalc(D.cells); renderValues(); ctx.save(D); }
  function toggleFmt(key) {
    const { c1, r1, c2, r2 } = norm(sel);
    const cur = D.fmt[refOf(active)] || {};
    const next = !cur[key];
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const ref = makeRef(c, r); D.fmt[ref] = Object.assign({}, D.fmt[ref], { [key]: next });
      if (!D.fmt[ref].b && !D.fmt[ref].i) delete D.fmt[ref];
    }
    renderValues(); ctx.save(D); syncFmtToggles();
  }
  function quickSum() {
    const { c1, r1, c2, r2 } = norm(sel);
    let target, range;
    if (r1 === r2 && c1 === c2) { // single cell: sum the column above it
      const top = firstNumAbove(active.c, active.r);
      target = refOf(active); range = `${makeRef(active.c, top)}:${makeRef(active.c, active.r - 1)}`;
    } else { target = makeRef(c2, r2 + 1 <= D.rows ? r2 + 1 : r2); range = `${makeRef(c1, r1)}:${makeRef(c2, r2)}`; }
    setRaw(target, `=SUM(${range})`);
    toast('Inserted SUM');
  }
  function firstNumAbove(c, r) { let t = r - 1; while (t > 1 && D.cells[makeRef(c, t - 1)] != null) t--; return Math.max(1, t); }
  function copySel() {
    const { c1, r1, c2, r2 } = norm(sel); const lines = [];
    for (let r = r1; r <= r2; r++) { const row = []; for (let c = c1; c <= c2; c++) { const v = values[makeRef(c, r)]; row.push(v ? v.display : ''); } lines.push(row.join('\t')); }
    navigator.clipboard?.writeText(lines.join('\n')); toast('Copied');
  }
  function round(n) { return Math.round(n * 1e6) / 1e6; }

  /* ---- exporters ---- */
  const exports = [
    { label: 'CSV (.csv)', icon: icons.sheets, run: () => { downloadFile(fname('csv'), toCSV(','), 'text/csv'); toast('Exported CSV'); } },
    { label: 'Excel XML (.xls)', icon: icons.sheets, hint: 'opens in Excel', run: () => { downloadFile(fname('xls'), toExcelXML(), 'application/vnd.ms-excel'); toast('Exported Excel file'); } },
    { label: 'HTML table (.html)', icon: icons.sheets, run: () => { downloadFile(fname('html'), toHTML(), 'text/html'); toast('Exported HTML'); } },
    { label: 'Print / PDF', icon: icons.print, run: () => window.print() },
  ];
  function fname(ext) { return (file.name || 'sheet').replace(/[^\w.-]+/g, '_') + '.' + ext; }
  function usedBounds() { let mc = 1, mr = 1; for (const ref in D.cells) { const p = parseRef(ref); if (p) { mc = Math.max(mc, p.col); mr = Math.max(mr, p.row); } } return { mc, mr }; }
  function toCSV(sep) {
    const { mc, mr } = usedBounds(); const lines = [];
    for (let r = 1; r <= mr; r++) { const row = []; for (let c = 1; c <= mc; c++) { const v = values[makeRef(c, r)]; let s = v ? v.display : ''; if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'; row.push(s); } lines.push(row.join(sep)); }
    return lines.join('\n');
  }
  function toHTML() {
    const { mc, mr } = usedBounds(); let h = `<!doctype html><meta charset="utf-8"><title>${esc(file.name)}</title><table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:sans-serif">`;
    for (let r = 1; r <= mr; r++) { h += '<tr>'; for (let c = 1; c <= mc; c++) { const v = values[makeRef(c, r)]; h += `<td${v && v.isNumber ? ' align="right"' : ''}>${esc(v ? v.display : '')}</td>`; } h += '</tr>'; }
    return h + '</table>';
  }
  function toExcelXML() {
    const { mc, mr } = usedBounds();
    let rows = '';
    for (let r = 1; r <= mr; r++) {
      let cells = '';
      for (let c = 1; c <= mc; c++) {
        const v = values[makeRef(c, r)];
        if (!v || v.display === '') continue;
        const type = v.isNumber ? 'Number' : 'String';
        const val = v.isNumber ? v.value : esc(v.display);
        cells += `<Cell ss:Index="${c}"><Data ss:Type="${type}">${val}</Data></Cell>`;
      }
      rows += `<Row>${cells}</Row>`;
    }
    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${esc(file.name).slice(0, 28) || 'Sheet1'}"><Table>${rows}</Table></Worksheet>
</Workbook>`;
  }

  renderValues();
  setTimeout(focusGrid, 30);

  return { destroy() { window.removeEventListener('mouseup', () => {}); }, exports };
}

/* ---- helpers ---- */
function normalize(d) {
  const out = { cells: {}, cols: 26, rows: 100, fmt: {} };
  if (d) { Object.assign(out, { cols: d.cols || 26, rows: d.rows || 100 }); out.cells = d.cells ? { ...d.cells } : {}; out.fmt = d.fmt ? { ...d.fmt } : {}; }
  out.cols = Math.max(out.cols, 26); out.rows = Math.max(out.rows, 100);
  return out;
}
function norm(s) { return { c1: Math.min(s.c1, s.c2), c2: Math.max(s.c1, s.c2), r1: Math.min(s.r1, s.r2), r2: Math.max(s.r1, s.r2) }; }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function optionEl(v, label) { return el('option', { value: v, text: label }); }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
