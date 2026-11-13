/** A request to the Rekkferga API failed: network error, non-2xx status, or a malformed body. */
export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * GET a JSON resource. Throws ApiError on failure so callers can tell "failed" apart from
 * "succeeded with nothing in it". Aborts (AbortController) are re-thrown unchanged.
 */
export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ApiError('Network error');
  }
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status);
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('Invalid response body', res.status);
  }
}
