import { InjectionToken } from '@angular/core';

export interface HomeProductsCatalogConfig {
  initialLimit: number;
  batchSize: number;
  maxProducts: number;
}

export const DEFAULT_HOME_PRODUCTS_CATALOG_CONFIG = {
  initialLimit: 9,
  batchSize: 9,
  maxProducts: 18,
} as const satisfies HomeProductsCatalogConfig;

export const HOME_PRODUCTS_CATALOG_CONFIG =
  new InjectionToken<HomeProductsCatalogConfig>(
    'HOME_PRODUCTS_CATALOG_CONFIG',
    { factory: () => DEFAULT_HOME_PRODUCTS_CATALOG_CONFIG },
  );

export function normalizeCatalogConfig(
  config: HomeProductsCatalogConfig,
): HomeProductsCatalogConfig {
  const maxProducts = Math.max(1, Math.floor(config.maxProducts));

  return {
    initialLimit: Math.min(
      maxProducts,
      Math.max(1, Math.floor(config.initialLimit)),
    ),
    batchSize: Math.max(1, Math.floor(config.batchSize)),
    maxProducts,
  };
}
