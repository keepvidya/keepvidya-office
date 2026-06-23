// The model abstraction. The core depends on this, never on a concrete provider.
// Implemented by adapters/llm/* (a mock today; Shiva/BYOK at M4).
export interface LlmRequest {
  system: string;
  prompt: string;
}
export interface LlmResponse {
  text: string;
}
export interface LlmPort {
  complete(req: LlmRequest): Promise<LlmResponse>;
}
