import { describe, expect, it } from 'vitest';
import { normalizeDoc, wordCount } from '../../src/domain/doc/doc';
import { validateDocIntent } from '../../src/ai/intent/doc-intent';
import { applyDocIntent } from '../../src/ai/applier/doc-applier';

describe('TS-06.1 — doc domain, intent & applier', () => {
  it('TC-06.1.1 — valid doc intent parses', () => {
    const r = validateDocIntent(
      '{"blocks":[{"type":"heading","level":1,"text":"Hi"},{"type":"paragraph","text":"p"},{"type":"bullets","items":["a"]}]}',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.blocks).toHaveLength(3);
  });

  it('TC-06.1.2 — malformed / wrong shape rejected', () => {
    expect(validateDocIntent('nope').ok).toBe(false);
    expect(validateDocIntent('5').ok).toBe(false);
    expect(validateDocIntent('{"blocks":[]}').ok).toBe(false);
    expect(validateDocIntent('{"blocks":"x"}').ok).toBe(false);
    expect(validateDocIntent('{"blocks":[5]}').ok).toBe(false);
    expect(validateDocIntent('{"blocks":[{"type":"heading"}]}').ok).toBe(false); // no text
    expect(validateDocIntent('{"blocks":[{"type":"paragraph"}]}').ok).toBe(false);
    expect(validateDocIntent('{"blocks":[{"type":"bullets","items":"x"}]}').ok).toBe(false);
    expect(validateDocIntent('{"blocks":[{"type":"bullets","items":[3]}]}').ok).toBe(false);
    expect(validateDocIntent('{"blocks":[{"type":"wat","text":"x"}]}').ok).toBe(false);
  });

  it('TC-06.1.3 — applyDocIntent builds escaped HTML; level clamped (our markup)', () => {
    const r = validateDocIntent(
      '{"blocks":[{"type":"heading","level":5,"text":"A <b> B"},{"type":"paragraph","text":"hi"},{"type":"bullets","items":["x","y"]}]}',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b0 = r.value.blocks[0];
    if (b0.type === 'heading') expect(b0.level).toBe(3); // 5 clamped to 3
    const html = applyDocIntent(r.value).html;
    expect(html).toContain('<h3>A &lt;b&gt; B</h3>'); // model text escaped, not markup
    expect(html).toContain('<p>hi</p>');
    expect(html).toContain('<ul><li>x</li><li>y</li></ul>');
  });

  it('TC-06.1.4 — wordCount + normalizeDoc', () => {
    expect(wordCount('  hello   world ')).toBe(2);
    expect(wordCount('')).toBe(0);
    expect(normalizeDoc(undefined).html.length).toBeGreaterThan(0);
    expect(normalizeDoc({ html: '<p>x</p>' }).html).toBe('<p>x</p>');
  });
});
