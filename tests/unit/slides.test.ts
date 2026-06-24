import { describe, expect, it } from 'vitest';
import {
  type SlideDeck,
  STAGE_H,
  STAGE_W,
  addSlide,
  blankSlide,
  deleteSlide,
  normalizeDeck,
  setSlideText,
} from '../../src/domain/slides/slides';
import { validateDeckIntent } from '../../src/ai/intent/slide-intent';
import { applyDeckIntent } from '../../src/ai/applier/deck-applier';

describe('TS-04.1 — slides domain, intent & applier', () => {
  it('TC-04.1.1 — valid deck intent parses', () => {
    const r = validateDeckIntent('{"slides":[{"title":"Hi","bullets":["a","b"]}]}');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.slides[0].title).toBe('Hi');
      expect(r.value.slides[0].bullets).toEqual(['a', 'b']);
    }
  });

  it('TC-04.1.2 — malformed / wrong shape rejected', () => {
    expect(validateDeckIntent('nope').ok).toBe(false);
    expect(validateDeckIntent('5').ok).toBe(false);
    expect(validateDeckIntent('{"slides":"x"}').ok).toBe(false);
    expect(validateDeckIntent('{"slides":[]}').ok).toBe(false);
    expect(validateDeckIntent('{"slides":[5]}').ok).toBe(false);
    expect(validateDeckIntent('{"slides":[{"title":1,"bullets":[]}]}').ok).toBe(false);
    expect(validateDeckIntent('{"slides":[{"title":"x","bullets":"y"}]}').ok).toBe(false);
    expect(validateDeckIntent('{"slides":[{"title":"x","bullets":[2]}]}').ok).toBe(false);
    const tooManySlides = JSON.stringify({ slides: Array.from({ length: 51 }, () => ({ title: 't', bullets: [] })) });
    expect(validateDeckIntent(tooManySlides).ok).toBe(false);
    const tooManyBullets = JSON.stringify({ slides: [{ title: 't', bullets: Array(13).fill('b') }] });
    expect(validateDeckIntent(tooManyBullets).ok).toBe(false);
  });

  it('bullets default to empty + fenced extraction', () => {
    const r = validateDeckIntent('```json\n{"slides":[{"title":"Only title"}]}\n```');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.slides[0].bullets).toEqual([]);
  });

  it('TC-04.1.3/4 — applyDeckIntent lays out deterministically; slide 0 is a cover', () => {
    const deck = applyDeckIntent({
      slides: [
        { title: 'Cover', bullets: ['subtitle'] },
        { title: 'Content', bullets: ['x', 'y'] },
      ],
    });
    const s0 = deck.slides[0];
    expect(s0.bg).toBe('#1B2A33'); // ink cover background (our code)
    expect(s0.els[0].bold).toBe(true);
    expect(s0.els[0].html).toContain('Cover');

    const s1 = deck.slides[1];
    expect(s1.bg).toBe('#FFFFFF');
    expect(s1.els[1].html).toContain('x');
    expect(s1.els[1].html).toContain('y');

    // geometry is set by OUR code and stays within the stage (narrator boundary)
    for (const e of s1.els) {
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x + e.w).toBeLessThanOrEqual(STAGE_W);
      expect(e.y + e.h).toBeLessThanOrEqual(STAGE_H);
    }
  });

  it('TC-04.1.5 — deck ops are immutable + normalize', () => {
    const base: SlideDeck = { slides: [blankSlide()] };
    const added = addSlide(base);
    expect(added.slides).toHaveLength(2);
    expect(base.slides).toHaveLength(1); // unchanged
    expect(deleteSlide(base, 0).slides).toHaveLength(1); // never empty
    expect(deleteSlide(addSlide(base), 0).slides).toHaveLength(1);

    const deck = applyDeckIntent({ slides: [{ title: 'T', bullets: [] }] });
    const edited = setSlideText(deck, 0, 0, 'New');
    expect(edited.slides[0].els[0].html).toBe('New');
    expect(deck.slides[0].els[0].html).not.toBe('New'); // original unchanged

    expect(normalizeDeck(undefined).slides).toHaveLength(1);
    expect(normalizeDeck({ slides: [{ bg: '#000', els: [] }] }).slides[0].bg).toBe('#000');
  });
});
