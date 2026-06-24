// Orchestrator: prompt → validated doc intent (pipeline) → deterministic HTML
// applier → DocData. Never throws; returns the original document + a note on failure.
import type { DocData } from '../domain/doc/doc';
import { applyDocIntent } from './applier/doc-applier';
import { validateDocIntent } from './intent/doc-intent';
import { type PipelineDeps, type TraceStep, generateIntent } from './pipeline';

export interface BuildDocResult {
  data: DocData;
  trace: TraceStep[];
  ok: boolean;
  note?: string;
}

const DOC_SYSTEM =
  'You produce a document as STRICT JSON only: {"blocks":[{"type":"heading","level":1,"text":"..."},{"type":"paragraph","text":"..."},{"type":"bullets","items":["...","..."]}]}. ' +
  'Use headings, paragraphs and bullet lists to structure the document. ' +
  'Do NOT include HTML, markdown or styling — only structured text. No prose outside the JSON, no code fences.';

export async function buildDoc(
  prompt: string,
  current: DocData,
  deps: PipelineDeps,
): Promise<BuildDocResult> {
  const outcome = await generateIntent(prompt, deps.llm, {
    system: DOC_SYSTEM,
    validate: validateDocIntent,
    maxRetries: deps.maxRetries,
  });
  if (!outcome.ok || !outcome.intent) {
    return {
      data: current, // unchanged on failure
      trace: outcome.trace,
      ok: false,
      note: outcome.error ?? 'The assistant could not produce a valid document.',
    };
  }
  return { data: applyDocIntent(outcome.intent), trace: outcome.trace, ok: true };
}
