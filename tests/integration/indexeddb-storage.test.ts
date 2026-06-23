import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createIndexedDbStorage } from '../../src/adapters/storage/indexeddb-storage';
import type { OfficeFile } from '../../src/domain/file';

const sample: OfficeFile = {
  id: 'f1',
  type: 'sheets',
  name: 'Budget',
  data: { cells: { A1: '1' } },
  created: 1,
  modified: 2,
};

function freshDb(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('kvoffice');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('TS-00.2 — IndexedDB adapter (integration, vendor NOT mocked)', () => {
  beforeEach(freshDb);

  it('TC-00.2.1 — round-trips a file and persists across adapter instances', async () => {
    const store = createIndexedDbStorage();

    // 1) put then getAll contains it
    await store.put(sample);
    const all = await store.getAll();
    expect(all).toContainEqual(sample);

    // 2) get by id
    expect(await store.get('f1')).toEqual(sample);

    // 3) a new adapter instance (simulating reload) still finds it
    const reopened = createIndexedDbStorage();
    expect(await reopened.get('f1')).toEqual(sample);

    // remove works
    await reopened.remove('f1');
    expect(await reopened.get('f1')).toBeNull();
  });
});
