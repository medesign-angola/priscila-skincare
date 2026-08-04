import { InjectionToken, Provider } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
}

const DEFAULT_API_URL = 'http://localhost:5041/api/v1';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function runtimeApiConfig(): ApiConfig {
  const runtimeConfig = (
    globalThis as typeof globalThis & {
      __PRISCILA_SKINCARE_CONFIG__?: { apiUrl?: string };
    }
  ).__PRISCILA_SKINCARE_CONFIG__;

  return { baseUrl: normalizeBaseUrl(runtimeConfig?.apiUrl || DEFAULT_API_URL) };
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  factory: runtimeApiConfig,
});

export function provideApi(config: ApiConfig): Provider {
  return {
    provide: API_CONFIG,
    useValue: { baseUrl: normalizeBaseUrl(config.baseUrl) },
  };
}
