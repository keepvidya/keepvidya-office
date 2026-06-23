// Inbound use-cases. Pure orchestration over ports — no DOM, no vendor, no IndexedDB types.
import type { ClockPort, IdPort, StoragePort } from './ports';
import { type FileType, type OfficeFile, blankData, untitledName } from './file';
import { type AppError, type Result, Err, Ok } from './result';

export interface CoreDeps {
  storage: StoragePort;
  clock: ClockPort;
  id: IdPort;
}

export async function createFile(
  deps: CoreDeps,
  type: FileType,
  name?: string,
): Promise<Result<OfficeFile, AppError>> {
  const ts = deps.clock.now();
  const file: OfficeFile = {
    id: deps.id.next(),
    type,
    name: name?.trim() || untitledName(type),
    data: blankData(type),
    created: ts,
    modified: ts,
  };
  try {
    await deps.storage.put(file);
    return Ok(file);
  } catch (e) {
    return Err({ kind: 'StorageError', cause: String(e) });
  }
}

export async function listFiles(deps: CoreDeps): Promise<OfficeFile[]> {
  const all = await deps.storage.getAll();
  return [...all].sort((a, b) => b.modified - a.modified);
}

export async function openFile(deps: CoreDeps, id: string): Promise<Result<OfficeFile, AppError>> {
  const file = await deps.storage.get(id);
  return file ? Ok(file) : Err({ kind: 'NotFound', id });
}

export async function renameFile(
  deps: CoreDeps,
  id: string,
  name: string,
): Promise<Result<OfficeFile, AppError>> {
  const existing = await deps.storage.get(id);
  if (!existing) return Err({ kind: 'NotFound', id });
  const updated: OfficeFile = {
    ...existing,
    name: name.trim() || untitledName(existing.type),
    modified: deps.clock.now(),
  };
  await deps.storage.put(updated);
  return Ok(updated);
}

export async function saveData(
  deps: CoreDeps,
  id: string,
  data: unknown,
): Promise<Result<OfficeFile, AppError>> {
  const existing = await deps.storage.get(id);
  if (!existing) return Err({ kind: 'NotFound', id });
  const updated: OfficeFile = { ...existing, data, modified: deps.clock.now() };
  await deps.storage.put(updated);
  return Ok(updated);
}

export async function deleteFile(deps: CoreDeps, id: string): Promise<void> {
  await deps.storage.remove(id);
}
