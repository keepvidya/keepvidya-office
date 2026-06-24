// pptx export via pptxgenjs (wrapped here only). Each slide element becomes a text
// box; our px geometry maps to the 10×5.625in 16:9 layout.
import pptxgen from 'pptxgenjs';
import { type SlideDeck, STAGE_H, STAGE_W } from '../../domain/slides/slides';
import { htmlToText } from './html';

const MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export async function exportPptx(deck: SlideDeck): Promise<Blob> {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'KV', width: 10, height: 5.625 });
  pptx.layout = 'KV';
  const sx = 10 / STAGE_W;
  const sy = 5.625 / STAGE_H;

  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: hex(s.bg) };
    for (const e of s.els) {
      const text = htmlToText(e.html);
      if (!text) continue;
      slide.addText(text, {
        x: e.x * sx,
        y: e.y * sy,
        w: e.w * sx,
        h: e.h * sy,
        fontSize: Math.max(8, Math.round(e.size * 0.75)),
        bold: e.bold,
        color: hex(e.color),
        align: e.align,
        valign: 'top',
      });
    }
  }

  const out = await pptx.write({ outputType: 'arraybuffer' });
  return new Blob([out as ArrayBuffer], { type: MIME });
}

function hex(c: string): string {
  return (c || '#000000').replace('#', '').toUpperCase();
}
