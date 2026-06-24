import { describe, expect, it } from 'vitest';
import { buildDeck } from '../../src/ai/deck-orchestrator';
import { normalizeDeck } from '../../src/domain/slides/slides';
import { createFixtureLlm, createScriptedLlm } from '../../src/adapters/llm/mock-llm';

const empty = normalizeDeck(undefined);

describe('TS-04.2 — buildDeck orchestrator (integration)', () => {
  it('TC-04.2.1 — prompt → multi-slide deck', async () => {
    const r = await buildDeck('a pitch for my app', empty, { llm: createFixtureLlm() });
    expect(r.ok).toBe(true);
    expect(r.deck.slides.length).toBeGreaterThanOrEqual(3);
    expect(r.deck.slides[0].els[0].html.length).toBeGreaterThan(0); // cover title element
    expect(r.deck.slides[1].els[1].html.length).toBeGreaterThan(0); // content bullets element
  });

  it('leaves the deck unchanged + notes on failure', async () => {
    const r = await buildDeck('x', empty, { llm: createScriptedLlm(['garbage']), maxRetries: 1 });
    expect(r.ok).toBe(false);
    expect(r.deck).toBe(empty);
    expect(r.note).toBeTruthy();
  });
});
