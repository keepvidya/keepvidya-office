// Deck applier (Builder): turns validated slide CONTENT into a real SlideDeck.
// ALL geometry, colour and typography is decided HERE (our code) — the narrator
// boundary made literal. Slide 0 is a centred cover; the rest are title + bullets.
import { type Slide, type SlideDeck, type TextElement } from '../../domain/slides/slides';
import type { SlideContent, SlideIntent } from '../intent/slide-intent';

const INK = '#1B2A33';
const SLATE = '#33474F';
const COPPER = '#C0703C';
const PAPER = '#FBF8F3';

export function applyDeckIntent(intent: SlideIntent): SlideDeck {
  const slides: Slide[] = intent.slides.map((s, i) =>
    i === 0 ? coverSlide(s) : contentSlide(s),
  );
  return { slides };
}

function coverSlide(s: SlideContent): Slide {
  return {
    bg: INK,
    els: [
      text({ x: 90, y: 200, w: 780, h: 120, html: esc(s.title), size: 54, bold: true, color: PAPER, align: 'center' }),
      text({ x: 90, y: 330, w: 780, h: 60, html: esc(s.bullets[0] ?? ''), size: 22, bold: false, color: COPPER, align: 'center' }),
    ],
  };
}

function contentSlide(s: SlideContent): Slide {
  const body = s.bullets.map((b) => '•  ' + esc(b)).join('<br><br>');
  return {
    bg: '#FFFFFF',
    els: [
      text({ x: 64, y: 54, w: 832, h: 80, html: esc(s.title), size: 38, bold: true, color: INK, align: 'left' }),
      text({ x: 64, y: 168, w: 832, h: 324, html: body, size: 24, bold: false, color: SLATE, align: 'left' }),
    ],
  };
}

function text(p: Omit<TextElement, 'kind'>): TextElement {
  return { kind: 'text', ...p };
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c);
}
