// Slides editor — renders a deck (thumbnail rail + stage), an AI prompt bar, inline
// text editing, add/delete, and a full-screen present mode. DOM lives here (UI layer);
// deck logic comes from the slides domain; AI via an injected buildDeck function.
import { el } from '../dom';
import {
  type SlideDeck,
  type SlideElement,
  STAGE_H,
  STAGE_W,
  addSlide,
  deleteSlide,
  setSlideText,
} from '../../domain/slides/slides';

const THUMB_W = 150;

export interface SlidesHandlers {
  data: SlideDeck;
  onChange: (data: SlideDeck) => void;
  aiBuild?: (prompt: string, deck: SlideDeck) => Promise<{ deck: SlideDeck; ok: boolean; note?: string }>;
}

export function renderSlides(h: SlidesHandlers): HTMLElement {
  let deck = h.data;
  let cur = 0;

  const railEl = el('div', { class: 'sl-rail', 'data-testid': 'sl-rail' });
  const stage = el('div', { class: 'sl-stage', 'data-testid': 'sl-stage' });
  const stageWrap = el('div', { class: 'sl-stagewrap' }, [stage]);

  const save = (): void => h.onChange(deck);

  function styleEl(node: HTMLElement, e: SlideElement): void {
    node.style.cssText =
      `position:absolute;left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;` +
      `font-size:${e.size}px;color:${e.color};text-align:${e.align};` +
      `font-weight:${e.bold ? 700 : 400};line-height:1.25;overflow:hidden;` +
      `font-family:var(--font-body);outline:none;word-break:break-word`;
  }
  function renderElNode(e: SlideElement, idx: number, isThumb: boolean): HTMLElement {
    const node = el('div', { class: 'sl-el' });
    styleEl(node, e);
    node.innerHTML = e.html;
    if (!isThumb) {
      node.setAttribute('data-testid', 'sl-el');
      node.addEventListener('dblclick', () => editText(node, idx));
    }
    return node;
  }

  function renderStage(): void {
    stage.style.background = deck.slides[cur].bg;
    stage.innerHTML = '';
    deck.slides[cur].els.forEach((e, idx) => stage.appendChild(renderElNode(e, idx, false)));
  }
  function renderRail(): void {
    railEl.innerHTML = '';
    deck.slides.forEach((s, i) => {
      const mini = el('div', {
        class: 'sl-mini',
        style: `width:${STAGE_W}px;height:${STAGE_H}px;background:${s.bg};transform:scale(${THUMB_W / STAGE_W})`,
      });
      s.els.forEach((e) => mini.appendChild(renderElNode(e, -1, true)));
      const thumb = el('div', {
        class: 'sl-thumb' + (i === cur ? ' on' : ''),
        'data-testid': 'sl-thumb',
        onclick: () => {
          cur = i;
          renderAll();
        },
      }, [el('span', { class: 'sl-thumb-n', text: i + 1 }), mini]);
      railEl.appendChild(thumb);
    });
    const add = el('button', {
      class: 'sl-add',
      text: '+ Add slide',
      'data-testid': 'sl-add',
      onclick: () => {
        deck = addSlide(deck);
        cur = deck.slides.length - 1;
        renderAll();
        save();
      },
    });
    railEl.appendChild(add);
  }

  function editText(node: HTMLElement, idx: number): void {
    node.setAttribute('contenteditable', 'true');
    node.focus();
    const finish = (): void => {
      node.removeAttribute('contenteditable');
      deck = setSlideText(deck, cur, idx, node.innerHTML);
      node.removeEventListener('blur', finish);
      save();
      renderRail();
    };
    node.addEventListener('blur', finish);
  }

  function renderAll(): void {
    renderRail();
    renderStage();
  }

  /* present mode */
  function present(): void {
    let i = cur;
    const box = el('div', { class: 'sl-present-stage' });
    const overlay = el('div', { class: 'sl-present', 'data-testid': 'sl-present' }, [box]);
    const show = (n: number): void => {
      i = Math.max(0, Math.min(deck.slides.length - 1, n));
      const s = deck.slides[i];
      box.style.background = s.bg;
      box.innerHTML = '';
      const inner = el('div', { class: 'sl-present-inner', style: `width:${STAGE_W}px;height:${STAGE_H}px` });
      s.els.forEach((e) => inner.appendChild(renderElNode(e, -1, true)));
      box.appendChild(inner);
      requestAnimationFrame(() => {
        inner.style.transform = `scale(${box.clientWidth / STAGE_W})`;
      });
    };
    const key = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') close();
      else if (ev.key === 'ArrowRight' || ev.key === ' ') show(i + 1);
      else if (ev.key === 'ArrowLeft') show(i - 1);
    };
    const close = (): void => {
      document.removeEventListener('keydown', key);
      overlay.remove();
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(overlay);
    show(cur);
  }

  /* toolbar */
  const toolbar = el('div', { class: 'sl-toolbar' });
  if (h.aiBuild) {
    const aiBuild = h.aiBuild;
    const promptInput = el('input', {
      class: 'ai-prompt',
      placeholder: 'Describe a presentation… (e.g. a 5-slide pitch for my app)',
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
        const out = await aiBuild(p, deck);
        deck = out.deck;
        cur = 0;
        renderAll();
        save();
        note.textContent = out.ok ? '✓ deck ready' : (out.note ?? 'No result');
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = 'Generate';
      }
    };
    genBtn.addEventListener('click', () => void run());
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void run();
    });
    toolbar.append(el('span', { class: 'ai-spark', text: '✦' }), promptInput, genBtn, note);
  }
  toolbar.append(
    el('button', { class: 'sl-tb-btn present', text: '▶ Present', 'data-testid': 'sl-present-btn', onclick: () => present() }),
    el('button', {
      class: 'sl-tb-btn',
      text: 'Delete slide',
      'data-testid': 'sl-delete',
      onclick: () => {
        deck = deleteSlide(deck, cur);
        cur = Math.min(cur, deck.slides.length - 1);
        renderAll();
        save();
      },
    }),
  );

  const root = el('div', { class: 'sl-root' }, [toolbar, el('div', { class: 'sl-body' }, [railEl, stageWrap])]);
  renderAll();
  return root;
}
