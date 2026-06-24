// Orchestrator: prompt → validated deck intent (pipeline) → deterministic layout
// applier → SlideDeck. Never throws; returns the original deck + a note on failure.
import type { SlideDeck } from '../domain/slides/slides';
import { applyDeckIntent } from './applier/deck-applier';
import { validateDeckIntent } from './intent/slide-intent';
import { type PipelineDeps, type TraceStep, generateIntent } from './pipeline';

export interface BuildDeckResult {
  deck: SlideDeck;
  trace: TraceStep[];
  ok: boolean;
  note?: string;
}

const DECK_SYSTEM =
  'You produce a slide deck as STRICT JSON only: {"slides":[{"title":"...","bullets":["...","..."]}]}. ' +
  'Each slide has a short title and 2–5 concise bullet strings. The FIRST slide is the cover (its first bullet is a one-line subtitle). ' +
  'Do NOT include positions, colours, sizes or formatting — only text. No prose, no code fences.';

export async function buildDeck(
  prompt: string,
  current: SlideDeck,
  deps: PipelineDeps,
): Promise<BuildDeckResult> {
  const outcome = await generateIntent(prompt, deps.llm, {
    system: DECK_SYSTEM,
    validate: validateDeckIntent,
    maxRetries: deps.maxRetries,
  });
  if (!outcome.ok || !outcome.intent) {
    return {
      deck: current, // unchanged on failure
      trace: outcome.trace,
      ok: false,
      note: outcome.error ?? 'The assistant could not produce a valid deck.',
    };
  }
  return { deck: applyDeckIntent(outcome.intent), trace: outcome.trace, ok: true };
}
