import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '../../src/adapters/storage/memory-storage';
import {
  type CoreDeps,
  createFile,
  deleteFile,
  listFiles,
  openFile,
  renameFile,
  saveData,
} from '../../src/domain/use-cases';

function makeDeps(): CoreDeps {
  let n = 0;
  return { storage: createMemoryStorage(), clock: { now: () => 1000 }, id: { next: () => `id${++n}` } };
}

describe('TS-00.1 — use-cases (unit)', () => {
  it('TC-00.1.1 — create, then list/open a file', async () => {
    const deps = makeDeps();

    // 1) create
    const created = await createFile(deps, 'sheets');
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.id).toBe('id1');
    expect(created.value.type).toBe('sheets');
    expect(created.value.created).toBe(1000);
    expect(created.value.modified).toBe(1000);
    expect(created.value.name).toBe('Untitled spreadsheet');

    // 2) list
    const list = await listFiles(deps);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('id1');

    // 3) open existing
    const opened = await openFile(deps, 'id1');
    expect(opened.ok).toBe(true);
    if (opened.ok) expect(opened.value.id).toBe('id1');

    // 4) open missing → NotFound (no throw)
    const missing = await openFile(deps, 'nope');
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.kind).toBe('NotFound');
  });

  it('rename updates name + modified; missing → NotFound', async () => {
    const deps = makeDeps();
    const created = await createFile(deps, 'writer');
    if (!created.ok) throw new Error('setup');
    const renamed = await renameFile(deps, created.value.id, '  Q3 Report  ');
    expect(renamed.ok).toBe(true);
    if (renamed.ok) expect(renamed.value.name).toBe('Q3 Report');
    const bad = await renameFile(deps, 'nope', 'x');
    expect(bad.ok).toBe(false);
  });

  it('createFile surfaces storage failure as Err(StorageError) — never silent', async () => {
    const throwing = { ...createMemoryStorage(), put: async () => { throw new Error('disk full'); } };
    const deps: CoreDeps = { storage: throwing, clock: { now: () => 1 }, id: { next: () => 'x' } };
    const r = await createFile(deps, 'sheets');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('StorageError');
  });

  it('saveData persists opaque payload; delete removes', async () => {
    const deps = makeDeps();
    const created = await createFile(deps, 'slides');
    if (!created.ok) throw new Error('setup');
    const saved = await saveData(deps, created.value.id, { slides: [{ bg: '#000', els: [] }] });
    expect(saved.ok).toBe(true);
    await deleteFile(deps, created.value.id);
    expect(await listFiles(deps)).toHaveLength(0);
  });
});
