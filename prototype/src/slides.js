// Keepvidya Office — Slides (presentation editor with a present mode).
import { icons } from './icons.js';
import { el, toast } from './main.js';
import { downloadFile } from './store.js';

const STAGE_W = 960, STAGE_H = 540;

export function mountSlides(host, file, ctx) {
  const deck = (file.data && file.data.slides && file.data.slides.length) ? file.data.slides : [blankSlide()];
  let cur = 0, selIdx = -1, editingEl = false;

  const railEl = el('div', { class: 'sl-rail' });
  const stage = el('div', { class: 'sl-stage' });
  const stageWrap = el('div', { class: 'sl-stage-wrap' }, [stage]);
  const ctxbar = el('div', { class: 'tbar' });

  host.append(ctxbar, el('div', { class: 'sl-wrap' }, [railEl, stageWrap]));

  const save = () => ctx.save({ slides: deck });

  /* ---------- toolbar ---------- */
  function renderToolbar() {
    ctxbar.innerHTML = '';
    const add = (ic, title, fn) => el('button', { class: 'tb', title, html: ic, onclick: fn });
    const left = el('div', { class: 'grp' }, [
      add(icons.text, 'Add text', () => addEl({ type: 'text', x: 120, y: 230, w: 720, h: 90, html: 'New text', size: 28, color: '#1B2A33', align: 'left' })),
      add(icons.shape, 'Add box', () => addEl({ type: 'shape', x: 360, y: 200, w: 240, h: 140, fill: '#C0703C' })),
      add(icons.image, 'Add image', pickImage),
    ]);
    ctxbar.append(left);

    const slideOps = el('div', { class: 'grp' }, [
      add(icons.copy, 'Duplicate slide', dupSlide),
      add(icons.trash, 'Delete slide', delSlide),
    ]);
    const bg = el('input', { class: 'tbcolor', type: 'color', title: 'Slide background', value: deck[cur].bg || '#FFFFFF', oninput: () => { deck[cur].bg = bg.value; renderStage(); renderRail(); save(); } });
    ctxbar.append(el('div', { class: 'grp' }, [bg]), slideOps);

    // contextual: selected element
    const e = selEl();
    if (e && e.type === 'text') {
      const size = el('select', { class: 'tbsel', title: 'Text size', onchange: () => { e.size = +size.value; renderStage(); save(); } },
        [12, 16, 20, 24, 28, 32, 40, 48, 60, 72].map(s => optionEl(String(s), s + ' px', s === e.size)));
      const color = el('input', { class: 'tbcolor', type: 'color', value: e.color || '#1B2A33', oninput: () => { e.color = color.value; renderStage(); save(); } });
      const tog = (ic, title, key) => el('button', { class: 'tb' + (e[key] ? ' on' : ''), title, html: ic, onclick: () => { e[key] = !e[key]; renderStage(); save(); renderToolbar(); } });
      const al = (ic, title, val) => el('button', { class: 'tb' + (e.align === val ? ' on' : ''), title, html: ic, onclick: () => { e.align = val; renderStage(); save(); renderToolbar(); } });
      ctxbar.append(
        el('div', { class: 'grp' }, [size, tog(icons.bold, 'Bold', 'bold'), tog(icons.italic, 'Italic', 'ital'), color]),
        el('div', { class: 'grp' }, [al(icons.alignL, 'Left', 'left'), al(icons.alignC, 'Centre', 'center'), al(icons.alignR, 'Right', 'right')]),
      );
    }
    if (e) ctxbar.append(el('div', { class: 'grp' }, [el('button', { class: 'tb', title: 'Delete element', html: icons.trash, onclick: delEl })]));
  }

  /* ---------- rail ---------- */
  function renderRail() {
    railEl.innerHTML = '';
    deck.forEach((s, i) => {
      const mini = el('div', { class: 'mini', style: `width:${STAGE_W}px;height:${STAGE_H}px;background:${s.bg || '#fff'};transform:scale(${164 / STAGE_W})` });
      s.els.forEach(e => mini.appendChild(renderElNode(e, -1, true)));
      const t = el('div', { class: 'sl-thumb' + (i === cur ? ' on' : ''), onclick: () => { cur = i; selIdx = -1; renderAll(); } }, [el('div', { class: 'n', text: i + 1 }), mini]);
      railEl.appendChild(t);
    });
    railEl.appendChild(el('button', { class: 'sl-add', html: icons.plus + 'Add slide', onclick: addSlide }));
  }

  /* ---------- stage ---------- */
  function renderStage() {
    stage.style.background = deck[cur].bg || '#fff';
    stage.innerHTML = '';
    deck[cur].els.forEach((e, idx) => stage.appendChild(renderElNode(e, idx, false)));
  }
  function renderElNode(e, idx, isThumb) {
    const node = el('div', { class: 'sl-el ' + e.type, style: `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px` });
    if (e.type === 'text') {
      node.style.cssText += `;font-size:${e.size}px;color:${e.color || '#1B2A33'};text-align:${e.align || 'left'};font-weight:${e.bold ? '700' : '400'};font-style:${e.ital ? 'italic' : 'normal'};line-height:1.25;font-family:var(--font-body);overflow-wrap:anywhere`;
      node.innerHTML = e.html || '';
    } else if (e.type === 'shape') {
      node.style.cssText += `;background:${e.fill};border-radius:${e.round ? '14px' : '3px'}`;
    } else if (e.type === 'image') {
      node.style.cssText += `;background:#eee no-repeat center/contain url("${e.src}")`;
    }
    if (isThumb) { node.style.cursor = 'default'; return node; }
    if (idx === selIdx) {
      node.classList.add('sel');
      node.appendChild(el('div', { class: 'handle', onmousedown: (ev) => startResize(ev, e) }));
    }
    node.dataset.idx = idx;
    node.addEventListener('mousedown', (ev) => { if (editingEl) return; ev.stopPropagation(); selIdx = idx; renderStage(); renderToolbar(); startDrag(ev, e); });
    if (e.type === 'text') node.addEventListener('dblclick', (ev) => { ev.stopPropagation(); editText(node, e); });
    return node;
  }
  stage.addEventListener('mousedown', () => { if (!editingEl) { selIdx = -1; renderStage(); renderToolbar(); } });

  /* ---------- element editing ---------- */
  function editText(node, e) {
    editingEl = true;
    node.setAttribute('contenteditable', 'true');
    node.classList.add('sel');
    node.focus();
    const finish = () => {
      editingEl = false;
      node.removeAttribute('contenteditable');
      e.html = node.innerHTML;
      node.removeEventListener('blur', finish);
      save(); renderRail();
    };
    node.addEventListener('blur', finish);
  }
  function startDrag(ev, e) {
    const sx = ev.clientX, sy = ev.clientY, ox = e.x, oy = e.y;
    const scale = stage.getBoundingClientRect().width / STAGE_W;
    const move = (m) => { e.x = Math.round(ox + (m.clientX - sx) / scale); e.y = Math.round(oy + (m.clientY - sy) / scale); renderStage(); };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); save(); renderRail(); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  }
  function startResize(ev, e) {
    ev.stopPropagation();
    const sx = ev.clientX, sy = ev.clientY, ow = e.w, oh = e.h;
    const scale = stage.getBoundingClientRect().width / STAGE_W;
    const move = (m) => { e.w = Math.max(40, Math.round(ow + (m.clientX - sx) / scale)); e.h = Math.max(28, Math.round(oh + (m.clientY - sy) / scale)); renderStage(); };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); save(); renderRail(); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  }

  /* ---------- ops ---------- */
  function selEl() { return deck[cur].els[selIdx]; }
  function addEl(e) { deck[cur].els.push(e); selIdx = deck[cur].els.length - 1; renderAll(); save(); }
  function delEl() { if (selIdx < 0) return; deck[cur].els.splice(selIdx, 1); selIdx = -1; renderAll(); save(); }
  function addSlide() { deck.push(blankSlide()); cur = deck.length - 1; selIdx = -1; renderAll(); save(); }
  function dupSlide() { deck.splice(cur + 1, 0, JSON.parse(JSON.stringify(deck[cur]))); cur++; selIdx = -1; renderAll(); save(); }
  function delSlide() { if (deck.length === 1) { toast('A deck needs at least one slide'); return; } deck.splice(cur, 1); cur = Math.max(0, cur - 1); selIdx = -1; renderAll(); save(); }
  function pickImage() {
    const inp = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    inp.addEventListener('change', () => { const f = inp.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => addEl({ type: 'image', src: fr.result, x: 280, y: 140, w: 400, h: 260 }); fr.readAsDataURL(f); });
    document.body.appendChild(inp); inp.click(); inp.remove();
  }

  function renderAll() { renderRail(); renderStage(); renderToolbar(); }

  /* ---------- present mode ---------- */
  function present() {
    let i = cur;
    const box = el('div', { class: 'stagebox' });
    const overlay = el('div', { class: 'present' }, [box]);
    const nav = el('div', { class: 'pnav' }, [
      el('button', { html: '‹', onclick: () => show(i - 1) }),
      el('span', { class: 'pcount' }),
      el('button', { html: '›', onclick: () => show(i + 1) }),
      el('button', { html: '✕', title: 'Exit (Esc)', onclick: exit }),
    ]);
    overlay.appendChild(nav);
    function show(n) {
      i = Math.max(0, Math.min(deck.length - 1, n));
      const s = deck[i];
      box.style.background = s.bg || '#fff';
      box.innerHTML = '';
      const inner = el('div', { style: `position:absolute;inset:0;transform-origin:top left` });
      s.els.forEach(e => inner.appendChild(renderElNode(e, -1, true)));
      box.appendChild(inner);
      const fit = () => { const sc = box.clientWidth / STAGE_W; inner.style.transform = `scale(${sc})`; inner.style.width = STAGE_W + 'px'; inner.style.height = STAGE_H + 'px'; };
      requestAnimationFrame(fit);
      nav.querySelector('.pcount').textContent = `${i + 1} / ${deck.length}`;
    }
    function key(ev) { if (ev.key === 'Escape') exit(); else if (ev.key === 'ArrowRight' || ev.key === ' ') show(i + 1); else if (ev.key === 'ArrowLeft') show(i - 1); }
    function exit() { document.removeEventListener('keydown', key); overlay.remove(); }
    document.addEventListener('keydown', key);
    document.body.appendChild(overlay);
    show(cur);
  }

  /* ---------- exporters ---------- */
  function deckHTML() {
    const slidesHtml = deck.map(s => {
      const els = s.els.map(e => {
        const base = `position:absolute;left:${e.x / STAGE_W * 100}%;top:${e.y / STAGE_H * 100}%;width:${e.w / STAGE_W * 100}%;height:${e.h / STAGE_H * 100}%`;
        if (e.type === 'text') return `<div style="${base};font-size:${e.size / STAGE_H * 100}vh;color:${e.color};text-align:${e.align};font-weight:${e.bold ? 700 : 400};font-style:${e.ital ? 'italic' : 'normal'};line-height:1.25">${e.html}</div>`;
        if (e.type === 'shape') return `<div style="${base};background:${e.fill};border-radius:${e.round ? '1vw' : '2px'}"></div>`;
        if (e.type === 'image') return `<img style="${base};object-fit:contain" src="${e.src}">`;
        return '';
      }).join('');
      return `<section style="background:${s.bg || '#fff'}">${els}</section>`;
    }).join('\n');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(file.name)}</title><style>
*{margin:0;box-sizing:border-box}html,body{height:100%;background:#111;font-family:'Source Sans 3',system-ui,sans-serif}
.deck{height:100vh;display:flex;align-items:center;justify-content:center}
section{display:none;position:relative;width:min(96vw,calc(96vh*16/9));aspect-ratio:16/9;box-shadow:0 0 60px rgba(0,0,0,.6)}
section.on{display:block}.bar{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;background:rgba(0,0,0,.5);padding:6px 14px;border-radius:20px}
</style></head><body><div class="deck">${slidesHtml}</div><div class="bar"><span id="n">1</span> / ${deck.length} — ← → to navigate</div>
<script>let i=0;const S=[...document.querySelectorAll('section')];function show(n){i=Math.max(0,Math.min(S.length-1,n));S.forEach((s,x)=>s.classList.toggle('on',x===i));document.getElementById('n').textContent=i+1}document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')show(i+1);if(e.key==='ArrowLeft')show(i-1)});show(0);<\/script></body></html>`;
  }
  function fname(ext) { return (file.name || 'presentation').replace(/[^\w.-]+/g, '_') + '.' + ext; }
  const exports = [
    { label: 'Web deck (.html)', icon: icons.slides, hint: 'self-running', run: () => { downloadFile(fname('html'), deckHTML(), 'text/html'); toast('Exported web deck'); } },
    { label: 'Print / PDF', icon: icons.print, run: printDeck },
  ];
  function printDeck() {
    const w = window.open('', '_blank');
    w.document.write(deckHTML().replace('section{display:none', 'section{display:block;page-break-after:always;margin:0 auto').replace('.deck{height:100vh', '.deck{height:auto;display:block'));
    w.document.close(); setTimeout(() => w.print(), 400);
  }

  renderAll();
  return { destroy() {}, exports, onPresent: present };
}

function blankSlide() { return { bg: '#FFFFFF', els: [] }; }
function optionEl(v, label, sel) { const o = el('option', { value: v, text: label }); if (sel) o.selected = true; return o; }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
