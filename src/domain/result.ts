// A tiny Result type so use-cases surface failures explicitly (never silent — protocol §9).
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type AppError =
  | { kind: 'NotFound'; id: string }
  | { kind: 'StorageError'; cause: string }
  | { kind: 'Validation'; message: string };
