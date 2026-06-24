// Orchestrator: prompt → validated intent (pipeline) → deterministic applier → new
// sheet. Never throws; returns the original sheet + a note on failure.
import type { SheetData } from '../domain/sheet/sheet';
import { applySheetIntent } from './applier/sheet-applier';
import { type PipelineDeps, type TraceStep, generateSheetIntent } from './pipeline';

export interface FillResult {
  data: SheetData;
  trace: TraceStep[];
  ok: boolean;
  note?: string;
}

export async function fillSheet(
  prompt: string,
  data: SheetData,
  deps: PipelineDeps,
): Promise<FillResult> {
  const outcome = await generateSheetIntent(prompt, deps);
  if (!outcome.ok || !outcome.intent) {
    return {
      data, // unchanged on failure
      trace: outcome.trace,
      ok: false,
      note: outcome.error ?? 'The assistant could not produce a valid result.',
    };
  }
  return { data: applySheetIntent(data, outcome.intent), trace: outcome.trace, ok: true };
}
