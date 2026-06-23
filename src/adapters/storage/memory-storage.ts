// In-memory StoragePort — used by unit tests and as a fallback. No vendor.
import type { OfficeFile } from '../../domain/file';
import type { StoragePort } from '../../domain/ports';

export function createMemoryStorage(seed: OfficeFile[] = []): StoragePort {
  const map = new Map<string, OfficeFile>(seed.map((f) => [f.id, f]));
  return {
    async put(file) {
      map.set(file.id, file);
    },
    async getAll() {
      return [...map.values()];
    },
    async get(id) {
      return map.get(id) ?? null;
    },
    async remove(id) {
      map.delete(id);
    },
  };
}
