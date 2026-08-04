import { InjectionToken, Provider } from '@angular/core';

export interface CmsConfig {
  baseUrl: string;
  useMockFallbacks?: boolean;
}

const DEFAULT_CMS_URL = 'http://localhost:1337';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function runtimeCmsConfig(): CmsConfig {
  const runtimeConfig = (
    globalThis as typeof globalThis & {
      __PRISCILA_SKINCARE_CONFIG__?: {
        cmsUrl?: string;
        useMockFallbacks?: boolean;
      };
    }
  ).__PRISCILA_SKINCARE_CONFIG__;

  return {
    baseUrl: normalizeBaseUrl(runtimeConfig?.cmsUrl || DEFAULT_CMS_URL),
    useMockFallbacks: runtimeConfig?.useMockFallbacks ?? false,
  };
}

export function runtimeCmsUrl(): string {
  return runtimeCmsConfig().baseUrl;
}

export const CMS_CONFIG = new InjectionToken<CmsConfig>('CMS_CONFIG', {
  factory: runtimeCmsConfig,
});

export function provideCms(config: CmsConfig): Provider {
  return {
    provide: CMS_CONFIG,
    useValue: {
      baseUrl: normalizeBaseUrl(config.baseUrl),
      useMockFallbacks: config.useMockFallbacks ?? false,
    },
  };
}
