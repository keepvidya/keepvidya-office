// Shared types for the formula engine. Pure data — no logic, no vendor.

export type Ref = string;
export type RawCell = string | number;
export type CellMap = Record<Ref, RawCell | undefined>;

export type ErrCode =
  | '#DIV/0!'
  | '#VALUE!'
  | '#NAME?'
  | '#REF!'
  | '#N/A'
  | '#NUM!'
  | '#CIRC!'
  | '#ERROR!';

export interface ErrorValue {
  readonly __err: ErrCode;
}
export interface RangeValue {
  readonly __range: Scalar[][];
}

export type Scalar = number | string | boolean | null | ErrorValue;
export type PlainScalar = number | string | boolean | null; // Scalar with errors thrown out
export type EvalValue = Scalar | RangeValue;

export interface CellResult {
  value: Scalar;
  display: string;
  isNumber: boolean;
  isError: boolean;
}

export const ERR = (code: ErrCode): ErrorValue => ({ __err: code });
export const isErr = (v: unknown): v is ErrorValue =>
  typeof v === 'object' && v !== null && '__err' in v;
export const isRange = (v: unknown): v is RangeValue =>
  typeof v === 'object' && v !== null && '__range' in v;

/* ---- AST ---- */
export interface NumNode { t: 'num'; v: number }
export interface StrNode { t: 'str'; v: string }
export interface BoolNode { t: 'bool'; v: boolean }
export interface RefNode { t: 'ref'; ref: string }
export interface RangeNode { t: 'range'; a: string; b: string }
export interface UnaryNode { t: 'unary'; op: '+' | '-'; x: Node }
export interface PostfixNode { t: 'postfix'; op: '%'; x: Node }
export interface BinNode { t: 'bin'; op: string; l: Node; r: Node }
export interface CallNode { t: 'call'; name: string; args: Node[] }
export type Node =
  | NumNode | StrNode | BoolNode | RefNode | RangeNode
  | UnaryNode | PostfixNode | BinNode | CallNode;

/* ---- tokens ---- */
export type Token =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'ref'; v: string }
  | { t: 'name'; v: string }
  | { t: 'cmp'; v: string }
  | { t: '+' } | { t: '-' } | { t: '*' } | { t: '/' } | { t: '^' }
  | { t: '&' } | { t: '%' } | { t: '(' } | { t: ')' }
  | { t: ',' } | { t: ':' } | { t: 'eof' };

/* ---- evaluation collaborators ---- */
export interface Resolver {
  cell(ref: string): EvalValue;
  range(a: string, b: string): Scalar[][];
}
export interface FnCtx {
  ev(node: Node): EvalValue;
  range(node: Node): Scalar[][];
  nums(nodes: Node[]): number[];
  flat(nodes: Node[]): Scalar[];
}
export type FnImpl = (args: Node[], C: FnCtx) => EvalValue;
