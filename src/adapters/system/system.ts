// System adapters: real clock + id generator. Injected so tests can be deterministic.
import type { ClockPort, IdPort } from '../../domain/ports';

export function createSystemClock(): ClockPort {
  return { now: () => Date.now() };
}

export function createIdGen(): IdPort {
  return { next: () => 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) };
}
