// IndexedDB adapter implementing StoragePort. Wraps the browser's IndexedDB
// (the "vendor") so no IDB type ever leaks into domain/ui — the swap point if we
// move to a different local store. Uses native IndexedDB; no npm dependency.
import type { OfficeFile } from '../../domain/file';
import type { StoragePort } from '../../domain/ports';

const DB_NAME = 'kvoffice';
const STORE = 'files';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    /* v8 ignore next */
    req.onerror = () => reject(req.error);
  });
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    /* v8 ignore next */
    req.onerror = () => reject(req.error);
  });
}

export function createIndexedDbStorage(): StoragePort {
  // The connection is opened lazily and reused; each op runs in its own transaction.
  let dbp: Promise<IDBDatabase> | null = null;
  const db = () => (dbp ??= openDb());

  return {
    async put(file) {
      const d = await db();
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(file);
      await new Promise<void>((res, rej) => {
        tx.oncomplete = () => res();
        /* v8 ignore next */
        tx.onerror = () => rej(tx.error);
      });
    },
    async getAll() {
      const d = await db();
      return promisify<OfficeFile[]>(
        d.transaction(STORE, 'readonly').objectStore(STORE).getAll() as IDBRequest<OfficeFile[]>,
      );
    },
    async get(id) {
      const d = await db();
      const r = await promisify<OfficeFile | undefined>(
        d.transaction(STORE, 'readonly').objectStore(STORE).get(id) as IDBRequest<OfficeFile | undefined>,
      );
      return r ?? null;
    },
    async remove(id) {
      const d = await db();
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      await new Promise<void>((res, rej) => {
        tx.oncomplete = () => res();
        /* v8 ignore next */
        tx.onerror = () => rej(tx.error);
      });
    },
  };
}
