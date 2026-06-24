// Small POST-JSON helper with a timeout. Uses the platform `fetch` global (not npm).
export async function httpPostJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  timeoutMs = 30000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function trimUrl(base: string): string {
  return base.replace(/\/+$/, '');
}
