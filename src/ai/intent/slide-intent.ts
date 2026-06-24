// Deck intent contract (§6.1). The model emits ONLY slide content — titles + bullet
// strings. It never sets positions, sizes, colours or fonts; our applier owns layout.
export interface SlideContent {
  title: string;
  bullets: string[];
}
export interface SlideIntent {
  slides: SlideContent[];
}

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_SLIDES = 50;
const MAX_BULLETS = 12;

export function validateDeckIntent(text: string): Validated<SlideIntent> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    return { ok: false, error: 'Output was not valid JSON' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Expected a JSON object' };
  }
  const slides = (parsed as Record<string, unknown>).slides;
  if (!Array.isArray(slides)) return { ok: false, error: 'Missing "slides" array' };
  if (slides.length === 0) return { ok: false, error: '"slides" was empty' };
  if (slides.length > MAX_SLIDES) return { ok: false, error: `Too many slides (> ${MAX_SLIDES})` };

  const out: SlideContent[] = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i] as Record<string, unknown>;
    if (typeof s !== 'object' || s === null) return { ok: false, error: `slides[${i}] is not an object` };
    if (typeof s.title !== 'string') return { ok: false, error: `slides[${i}].title must be a string` };
    const bullets = s.bullets ?? [];
    if (!Array.isArray(bullets)) return { ok: false, error: `slides[${i}].bullets must be an array` };
    if (bullets.length > MAX_BULLETS) return { ok: false, error: `slides[${i}] has too many bullets` };
    const cleanBullets: string[] = [];
    for (let b = 0; b < bullets.length; b++) {
      if (typeof bullets[b] !== 'string') return { ok: false, error: `slides[${i}].bullets[${b}] must be a string` };
      cleanBullets.push(bullets[b] as string);
    }
    out.push({ title: s.title, bullets: cleanBullets });
  }
  return { ok: true, value: { slides: out } };
}

function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}
