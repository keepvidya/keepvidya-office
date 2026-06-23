// Deterministic applier (Command): turns a validated intent into real cells via the
// M2 sheet domain. The ONLY way AI output reaches a sheet. Immutable.
import { type SheetData, setCell } from '../../domain/sheet/sheet';
import type { SheetIntent } from '../intent/sheet-intent';

export function applySheetIntent(data: SheetData, intent: SheetIntent): SheetData {
  let next = data;
  for (const w of intent.writes) next = setCell(next, w.ref, w.value);
  return next;
}
