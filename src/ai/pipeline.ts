// Guardrail pipeline (Chain of Responsibility), generic over the intent type:
// build request → model → validate → (on failure) re-prompt with the validator
// error, bounded by maxRetries. Sheet/Deck pipelines are thin wrappers (Open/Closed).
import { type SheetIntent, validateSheetIntent } from './intent/sheet-intent';
import type { LlmPort } from './ports';

export interface TraceStep {
  attempt: number;
  ok: boolean;
  detail: string;
}
export interface IntentOutcome<T> {
  ok: boolean;
  intent?: T;
  error?: string;
  trace: TraceStep[];
}
export type Validator<T> = (text: string) => { ok: true; value: T } | { ok: false; error: string };
export interface GenConfig<T> {
  system: string;
  validate: Validator<T>;
  maxRetries?: number;
}
export interface PipelineDeps {
  llm: LlmPort;
  maxRetries?: number;
}

export async function generateIntent<T>(
  prompt: string,
  llm: LlmPort,
  cfg: GenConfig<T>,
): Promise<IntentOutcome<T>> {
  const maxRetries = cfg.maxRetries ?? 2;
  const trace: TraceStep[] = [];
  let lastError = '';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const userPrompt = lastError
      ? `${prompt}\n\nYour previous reply was rejected: ${lastError}\nReturn corrected JSON only.`
      : prompt;
    const res = await llm.complete({ system: cfg.system, prompt: userPrompt });
    const parsed = cfg.validate(res.text);
    if (parsed.ok) {
      trace.push({ attempt, ok: true, detail: 'validated' });
      return { ok: true, intent: parsed.value, trace };
    }
    lastError = parsed.error;
    trace.push({ attempt, ok: false, detail: parsed.error });
  }
  return { ok: false, error: lastError, trace };
}

const SHEET_SYSTEM =
  'You produce spreadsheet content as STRICT JSON only: {"writes":[{"ref":"A1","value":"..."}]}. ' +
  'ref is a cell like A1. value is a string; formulas start with "=". ' +
  'Do NOT compute results yourself — emit formulas and let the engine calculate. No prose, no code fences.';

// Back-compatible sheet wrapper (M3 API).
export function generateSheetIntent(
  prompt: string,
  deps: PipelineDeps,
): Promise<IntentOutcome<SheetIntent>> {
  return generateIntent(prompt, deps.llm, {
    system: SHEET_SYSTEM,
    validate: validateSheetIntent,
    maxRetries: deps.maxRetries,
  });
}
