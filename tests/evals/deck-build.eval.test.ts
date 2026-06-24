// AI eval (§6.4): score the deck pipeline's trajectory + result with a fixture model.
import { describe, expect, it } from 'vitest';
import { buildDeck } from '../../src/ai/deck-orchestrator';
import { normalizeDeck } from '../../src/domain/slides/slides';
import { createFixtureLlm } from '../../src/adapters/llm/mock-llm';

describe('TS-04.4 — deck eval (golden set, fixture model)', () => {
  it('TC-04.4.1 — deck rubric + trajectory', async () => {
    const r = await buildDeck(
      'a 5-slide pitch deck for my local-first office app',
      normalizeDeck(undefined),
      { llm: createFixtureLlm() },
    );

    // trajectory: validated, no retries
    expect(r.ok).toBe(true);
    expect(r.trace.filter((s) => !s.ok)).toHaveLength(0);
    expect(r.trace[r.trace.length - 1].ok).toBe(true);

    // rubric: multiple slides, a non-empty cover title, at least one slide with bullets
    expect(r.deck.slides.length).toBeGreaterThanOrEqual(3);
    expect(r.deck.slides[0].els[0].html.length).toBeGreaterThan(0);
    const hasBullets = r.deck.slides.slice(1).some((s) => s.els[1] && s.els[1].html.length > 0);
    expect(hasBullets).toBe(true);
  });
});
