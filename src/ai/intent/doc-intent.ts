// Document intent contract (§6.1). The model emits document STRUCTURE only —
// block types + text/items. It never emits HTML or styling; our applier owns that.
export type DocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] };

export interface DocIntent {
  blocks: DocBlock[];
}

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_BLOCKS = 200;
const MAX_ITEMS = 50;

export function validateDocIntent(text: string): Validated<DocIntent> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    return { ok: false, error: 'Output was not valid JSON' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Expected a JSON object' };
  }
  const blocks = (parsed as Record<string, unknown>).blocks;
  if (!Array.isArray(blocks)) return { ok: false, error: 'Missing "blocks" array' };
  if (blocks.length === 0) return { ok: false, error: '"blocks" was empty' };
  if (blocks.length > MAX_BLOCKS) return { ok: false, error: `Too many blocks (> ${MAX_BLOCKS})` };

  const out: DocBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i] as Record<string, unknown>;
    if (typeof b !== 'object' || b === null) return { ok: false, error: `blocks[${i}] is not an object` };
    if (b.type === 'heading') {
      if (typeof b.text !== 'string') return { ok: false, error: `blocks[${i}] heading needs text` };
      const lvl = typeof b.level === 'number' ? Math.min(3, Math.max(1, Math.round(b.level))) : 1;
      out.push({ type: 'heading', level: lvl as 1 | 2 | 3, text: b.text });
    } else if (b.type === 'paragraph') {
      if (typeof b.text !== 'string') return { ok: false, error: `blocks[${i}] paragraph needs text` };
      out.push({ type: 'paragraph', text: b.text });
    } else if (b.type === 'bullets') {
      if (!Array.isArray(b.items)) return { ok: false, error: `blocks[${i}] bullets needs an items array` };
      if (b.items.length > MAX_ITEMS) return { ok: false, error: `blocks[${i}] has too many items` };
      const items: string[] = [];
      for (let k = 0; k < b.items.length; k++) {
        if (typeof b.items[k] !== 'string') return { ok: false, error: `blocks[${i}].items[${k}] must be a string` };
        items.push(b.items[k] as string);
      }
      out.push({ type: 'bullets', items });
    } else {
      return { ok: false, error: `blocks[${i}] has unknown type "${String(b.type)}"` };
    }
  }
  return { ok: true, value: { blocks: out } };
}

function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}
