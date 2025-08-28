import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveBaseUrl(): string {
  // Highest priority: explicit config via env
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Web uses window.location hostname (works for localhost and LAN IPs)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const host = hostname || 'localhost';
    return `${protocol}//${host}:3000`;
  }

  // On native devices (Expo Go or dev builds), try to resolve LAN host from Expo
  const hostUri = (Constants as any)?.expoConfig?.hostUri
    || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri
    || (Constants as any)?.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:3000`;
  }

  // Android emulator fallback: cannot access host localhost — use 10.0.2.2
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';

  // iOS simulator fallback
  if (Platform.OS === 'ios') return 'http://localhost:3000';

  // Fallback
  return 'http://localhost:3000';
}

const DEFAULT_BASE_URL = resolveBaseUrl();

// Debug: log resolved API base URL once
// eslint-disable-next-line no-console
console.log('[API] Base URL:', DEFAULT_BASE_URL);

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
  const url = `${DEFAULT_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const { method = 'GET', body, headers } = options;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API ${method} ${url} failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as TResponse;
  }
  // Fallback for non-JSON
  return (await response.text()) as unknown as TResponse;
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
  return DEFAULT_BASE_URL;
}


