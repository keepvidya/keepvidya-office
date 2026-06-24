// Mock LlmPort — deterministic, dependency-free. Proves the pipeline in CI and the
// app demo without a live model. Replaced by a Shiva/BYOK adapter at M4 (same port).
import type { LlmPort } from '../../ai/ports';

// A fixed freelancer-budget intent the mock returns for any prompt. Net = SUM(B2:B4)
// = 4500 - 1500 - 600 = 2400 (computed by OUR engine, not the model).
export const BUDGET_FIXTURE = JSON.stringify({
  writes: [
    { ref: 'A1', value: 'Category' }, { ref: 'B1', value: 'Amount' },
    { ref: 'A2', value: 'Income' }, { ref: 'B2', value: '4500' },
    { ref: 'A3', value: 'Rent' }, { ref: 'B3', value: '-1500' },
    { ref: 'A4', value: 'Food' }, { ref: 'B4', value: '-600' },
    { ref: 'A5', value: 'Net' }, { ref: 'B5', value: '=SUM(B2:B4)' },
  ],
});

// A pitch-deck intent the mock returns for slide prompts.
export const DECK_FIXTURE = JSON.stringify({
  slides: [
    { title: 'Your Big Idea', bullets: ['A one-line description of what you do'] },
    { title: 'The Problem', bullets: ['People struggle with X', 'Existing tools are clunky', 'It wastes time and money'] },
    { title: 'Our Solution', bullets: ['We do X simply', 'Local-first and private', 'Fast to get started'] },
    { title: 'Traction', bullets: ['Early users love it', 'Growing every week', 'Strong retention'] },
    { title: 'The Ask', bullets: ['Partner with us', 'Try the beta', 'Spread the word'] },
  ],
});

// When called with no fixed text, route by the system prompt: deck vs sheet.
export function createFixtureLlm(text?: string): LlmPort {
  return {
    async complete(req) {
      if (text != null) return { text };
      return { text: /slide|deck/i.test(req.system) ? DECK_FIXTURE : BUDGET_FIXTURE };
    },
  };
}

// Returns the scripted responses in order (last one repeats) — used to exercise
// the self-correction loop (e.g. invalid → valid).
export function createScriptedLlm(responses: string[]): LlmPort {
  let i = 0;
  return {
    async complete() {
      return { text: responses[Math.min(i++, responses.length - 1)] };
    },
  };
}
