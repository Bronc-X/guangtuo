// Fixed, operator-configured endpoints only. Never use a URL from a model, file, or browser request.
export function trustedBaseUrl(value: string, prefix: string): string {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) throw new Error();
    return url.href.replace(/\/+$/, '');
  } catch { throw new Error(`${prefix}_INVALID_CONFIGURATION`); }
}

export async function requestBytes(url: string, options: {token: string; prefix: string; body?: unknown; maxBytes: number; timeoutMs: number}): Promise<Buffer> {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), options.timeoutMs);
  const fail = (suffix: string) => new Error(`${options.prefix}_${suffix}`);
  try {
    const response = await fetch(url, {method: options.body === undefined ? 'GET' : 'POST', redirect: 'error', signal: abort.signal, headers: {Authorization: `Bearer ${options.token}`, Accept: '*/*', ...(options.body === undefined ? {} : {'Content-Type': 'application/json'})}, ...(options.body === undefined ? {} : {body: JSON.stringify(options.body)})});
    if (!response.ok) {
      await response.body?.cancel();
      throw fail(response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : response.status === 429 ? 'RATE_LIMITED' : response.status === 404 ? 'NOT_FOUND' : response.status === 409 ? 'NOT_READY' : response.status === 503 ? 'UNAVAILABLE' : 'UPSTREAM_FAILED');
    }
    const reader = response.body?.getReader();
    if (!reader) throw fail('INVALID_RESPONSE');
    const buffers: Buffer[] = []; let size = 0;
    for (;;) {
      const result = await reader.read(); if (result.done) break;
      size += result.value.byteLength;
      if (size > options.maxBytes) { await reader.cancel(); throw fail('RESPONSE_TOO_LARGE'); }
      buffers.push(Buffer.from(result.value));
    }
    return Buffer.concat(buffers);
  } catch (error) {
    if (abort.signal.aborted) throw fail('TIMEOUT');
    if (error instanceof Error && error.message.startsWith(`${options.prefix}_`)) throw error;
    throw fail('UPSTREAM_FAILED');
  } finally { clearTimeout(timeout); }
}

export async function requestJson(url: string, options: Parameters<typeof requestBytes>[1]): Promise<unknown> {
  const bytes = await requestBytes(url, options);
  try { return JSON.parse(bytes.toString('utf8')) as unknown; }
  catch { throw new Error(`${options.prefix}_INVALID_RESPONSE`); }
}
