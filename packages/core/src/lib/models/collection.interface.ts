export interface CollectionMedia {
  type: 'image' | 'video';
  url: string;
  posterUrl?: string;
}

export interface CollectionHomeTranslation {
  title: string;
  description: string;
  footnote: string;
}

export interface CollectionHomePresentation {
  order: number;
  translations: Record<'pt' | 'fr', CollectionHomeTranslation>;
}

export interface CollectionTranslation {
  name: string;
  description: string;
}

import type { BundleDetailsTranslation } from './kit.interface';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailImage: string;
  productIds: string[];
  prices?: { AOA: number; EUR: number };
  relatedProductIds?: string[];
  details?: Record<'pt' | 'fr', BundleDetailsTranslation>;
  translations: Record<'pt' | 'fr', CollectionTranslation>;
  media?: CollectionMedia;
  home?: CollectionHomePresentation;
}
