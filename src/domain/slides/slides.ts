// Slides domain — deck model + immutable ops. Pure (no DOM/vendor). The 960×540
// stage is the coordinate space; all geometry is produced by our code, never the model.
export const STAGE_W = 960;
export const STAGE_H = 540;

export type Align = 'left' | 'center' | 'right';

export interface TextElement {
  kind: 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  html: string;
  size: number;
  bold: boolean;
  color: string;
  align: Align;
}
export type SlideElement = TextElement;

export interface Slide {
  bg: string;
  els: SlideElement[];
}
export interface SlideDeck {
  slides: Slide[];
}

export function blankSlide(): Slide {
  return { bg: '#FFFFFF', els: [] };
}

export function addSlide(deck: SlideDeck): SlideDeck {
  return { slides: [...deck.slides, blankSlide()] };
}

export function deleteSlide(deck: SlideDeck, index: number): SlideDeck {
  if (deck.slides.length <= 1) return deck; // never empty
  return { slides: deck.slides.filter((_, i) => i !== index) };
}

export function setSlideText(
  deck: SlideDeck,
  slideIndex: number,
  elIndex: number,
  html: string,
): SlideDeck {
  return {
    slides: deck.slides.map((s, si) =>
      si !== slideIndex
        ? s
        : { ...s, els: s.els.map((e, ei) => (ei !== elIndex ? e : { ...e, html })) },
    ),
  };
}

export function normalizeDeck(data: unknown): SlideDeck {
  const d = (data ?? {}) as { slides?: unknown };
  if (Array.isArray(d.slides) && d.slides.length > 0) {
    return { slides: d.slides.map(normSlide) };
  }
  return { slides: [blankSlide()] };
}

function normSlide(s: unknown): Slide {
  const o = (s ?? {}) as { bg?: unknown; els?: unknown };
  return {
    bg: typeof o.bg === 'string' ? o.bg : '#FFFFFF',
    els: Array.isArray(o.els) ? (o.els as SlideElement[]) : [],
  };
}
