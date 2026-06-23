// Guardrail pipeline (Chain of Responsibility): build request → model → validate →
// (on failure) re-prompt with the validator error, bounded by maxRetries.
import { type SheetIntent, validateSheetIntent } from './intent/sheet-intent';
import type { LlmPort } from './ports';

export interface TraceStep {
  attempt: number;
  ok: boolean;
  detail: string;
}
export interface IntentOutcome {
  ok: boolean;
  intent?: SheetIntent;
  error?: string;
  trace: TraceStep[];
}
export interface PipelineDeps {
  llm: LlmPort;
  maxRetries?: number;
}

const SYSTEM =
  'You produce spreadsheet content as STRICT JSON only: {"writes":[{"ref":"A1","value":"..."}]}. ' +
  'ref is a cell like A1. value is a string; formulas start with "=". ' +
  'Do NOT compute results yourself — emit formulas and let the engine calculate. No prose, no code fences.';

export async function generateSheetIntent(prompt: string, deps: PipelineDeps): Promise<IntentOutcome> {
  const maxRetries = deps.maxRetries ?? 2;
  const trace: TraceStep[] = [];
  let lastError = '';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const userPrompt = lastError
      ? `${prompt}\n\nYour previous reply was rejected: ${lastError}\nReturn corrected JSON only.`
      : prompt;
    const res = await deps.llm.complete({ system: SYSTEM, prompt: userPrompt });
    const parsed = validateSheetIntent(res.text);
    if (parsed.ok) {
      trace.push({ attempt, ok: true, detail: `validated ${parsed.value.writes.length} writes` });
      return { ok: true, intent: parsed.value, trace };
    }
    lastError = parsed.error;
    trace.push({ attempt, ok: false, detail: parsed.error });
  }
  return { ok: false, error: lastError, trace };
}
