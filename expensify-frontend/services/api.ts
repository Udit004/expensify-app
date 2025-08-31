import { getApiUrl, getEnvironmentInfo } from '../config/environment';

// Log environment information on startup
console.log('API Environment Info:', getEnvironmentInfo());

let chosenBaseUrl: string | undefined;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
}

export async function apiFetch<TResponse = unknown, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  if (!chosenBaseUrl) {
    chosenBaseUrl = getApiUrl();
    console.log('Using API URL:', chosenBaseUrl);
  }
  
  let url = `${chosenBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const { method = 'GET', body, headers } = options;

  let response: Response | undefined;
  try {
    console.log(`Making ${method} request to:`, url);
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.log('Request failed, trying fallback URL...');
    // If the current URL is not localhost, try localhost as fallback
    if (!chosenBaseUrl.includes('localhost') && !chosenBaseUrl.includes('10.0.2.2')) {
      const fallbackUrl = 'http://localhost:3000';
      chosenBaseUrl = fallbackUrl;
      url = `${chosenBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      console.log('Retrying with localhost fallback:', url);
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } else {
      throw err;
    }
  }

  if (!response!.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API ${method} ${url} failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response!.json()) as TResponse;
  }
  // Fallback for non-JSON
  return (await response!.text()) as unknown as TResponse;
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: 'GET', headers }),
  post: <T, B = unknown>(path: string, body?: B, headers?: Record<string, string>) =>
    apiFetch<T, B>(path, { method: 'POST', body, headers }),
  put: <T, B = unknown>(path: string, body?: B, headers?: Record<string, string>) =>
    apiFetch<T, B>(path, { method: 'PUT', body, headers }),
  delete: <T>(path: string, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: 'DELETE', headers }),
};

export function getApiBaseUrl(): string {
  return chosenBaseUrl || getApiUrl();
}

// Re-export environment info for convenience
export { getEnvironmentInfo } from '../config/environment';


