/**
 * InterviewAI - Shared API Client with CSRF Double-Submit Protection
 * Ponytail coding: minimal, native fetch wrapper, zero external dependencies.
 */

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(init?: RequestInit, isJson: boolean = true): Headers {
  const headers = new Headers(init?.headers);
  if (isJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const csrfToken = getCsrfToken();
  if (csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  return headers;
}

export const api = {
  /**
   * Safe GET request with automatic header propagation
   */
  get(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, {
      ...init,
      method: 'GET',
      headers: buildHeaders(init, false)
    });
  },

  /**
   * POST request with CSRF token and JSON serialization
   */
  post(url: string, body?: any, init?: RequestInit): Promise<Response> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = buildHeaders(init, !isFormData);
    return fetch(url, {
      ...init,
      method: 'POST',
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  /**
   * PUT request with CSRF token and JSON serialization
   */
  put(url: string, body?: any, init?: RequestInit): Promise<Response> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = buildHeaders(init, !isFormData);
    return fetch(url, {
      ...init,
      method: 'PUT',
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  /**
   * DELETE request with CSRF token
   */
  delete(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, {
      ...init,
      method: 'DELETE',
      headers: buildHeaders(init, false)
    });
  }
};
