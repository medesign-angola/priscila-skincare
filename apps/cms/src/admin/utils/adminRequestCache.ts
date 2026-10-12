import type { useFetchClient } from '@strapi/strapi/admin';

type AdminGet = ReturnType<typeof useFetchClient>['get'];
type AdminGetOptions = Parameters<AdminGet>[1];
type AdminResponse<T> = { data: T } & Record<string, unknown>;

type CacheEntry = {
  expiresAt: number;
  request: Promise<AdminResponse<unknown>>;
};

const requests = new Map<string, CacheEntry>();

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)]),
  );
}

function requestKey(url: string, options?: AdminGetOptions): string {
  return `${url}:${JSON.stringify(stableValue(options ?? {}))}`;
}

export function cachedAdminGet<T>(
  get: AdminGet,
  url: string,
  options?: AdminGetOptions,
  ttlMs = 45_000,
): Promise<AdminResponse<T>> {
  const key = requestKey(url, options);
  const now = Date.now();
  const cached = requests.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.request as Promise<AdminResponse<T>>;
  }

  if (cached) requests.delete(key);

  const request = (get<T>(url, options) as Promise<AdminResponse<T>>).catch(
    (error) => {
      requests.delete(key);
      throw error;
    },
  );

  requests.set(key, {
    expiresAt: now + ttlMs,
    request: request as Promise<AdminResponse<unknown>>,
  });

  return request;
}

export function invalidateAdminRequestCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    requests.clear();
    return;
  }

  for (const key of requests.keys()) {
    if (key.startsWith(`${urlPrefix}:`)) requests.delete(key);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('priscila:workflow-updated', () => {
    invalidateAdminRequestCache();
  });
}
