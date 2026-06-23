// The structured-intent contract (§6.1). The model may emit ONLY this shape; it
// is validated before anything is applied. Hand-written validator keeps the core
// dependency-free (no Zod) while still being a strict, machine-checkable schema.

export interface CellWrite {
  ref: string;
  value: string;
}
export interface SheetIntent {
  writes: CellWrite[];
}

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const REF_RE = /^[A-Za-z]+[1-9]\d*$/;
const MAX_WRITES = 500;

export function validateSheetIntent(text: string): Validated<SheetIntent> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    return { ok: false, error: 'Output was not valid JSON' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Expected a JSON object' };
  }
  const writes = (parsed as Record<string, unknown>).writes;
  if (!Array.isArray(writes)) return { ok: false, error: 'Missing "writes" array' };
  if (writes.length === 0) return { ok: false, error: '"writes" was empty' };
  if (writes.length > MAX_WRITES) return { ok: false, error: `Too many writes (> ${MAX_WRITES})` };

  const out: CellWrite[] = [];
  for (let i = 0; i < writes.length; i++) {
    const w = writes[i] as Record<string, unknown>;
    if (typeof w !== 'object' || w === null) return { ok: false, error: `writes[${i}] is not an object` };
    const ref = w.ref;
    const value = w.value;
    if (typeof ref !== 'string' || !REF_RE.test(ref)) {
      return { ok: false, error: `writes[${i}].ref "${String(ref)}" is not a valid cell reference` };
    }
    if (typeof value !== 'string') {
      return { ok: false, error: `writes[${i}].value must be a string` };
    }
    out.push({ ref: ref.toUpperCase(), value });
  }
  return { ok: true, value: { writes: out } };
}

// Models often wrap JSON in prose or ``` fences; pull out the JSON object.
function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}
