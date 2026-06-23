// Public surface of the formula engine (Facade).
export { recalc, evaluateFormula } from './engine';
export { colToNum, numToCol, parseRef, makeRef } from './refs';
export { numToStr } from './coerce';
export { FUNCTION_NAMES } from './functions';
export type { CellMap, CellResult, ErrCode, ErrorValue, RawCell, Ref, Scalar } from './types';
