import type { Product } from './product.interface';

export interface KitHomeTranslation {
  editorialTitle: string;
  editorialDescription: string;
  editorialFootnote: string;
  finderDescription: string;
}

export interface KitHomePresentation {
  order: number;
  thumbnailImage: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaStyle: 'split-right' | 'cover';
  placeholderUrl?: string;
  translations: {
    pt: KitHomeTranslation;
    fr: KitHomeTranslation;
  };
}

export interface KitTranslation {
  name: string;
  collection: string;
  description: string;
}

export interface BundleDetailsTranslation {
  images: string[];
  howToUse: Product['translations']['pt']['howToUse'];
  result: Product['translations']['pt']['result'];
}

export interface Kit {
  id: string;
  slug?: string;
  name: string;
  collection: string; // Subtitle/Collection name
  description: string; // Kit description/tagline até 45 caracteres
  price: number;
  prices?: { AOA: number; EUR: number };
  currency: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaStyle: 'split-right' | 'cover';
  thumbnailImage?: string;
  placeholderUrl?: string; // Stretched low-res blurred loading placeholder
  productIds: string[]; // referenced products
  relatedProductIds?: string[];
  details?: Record<'pt' | 'fr', BundleDetailsTranslation>;
  featured: boolean; // featured on homepage hero slider
  translations: Record<'pt' | 'fr', KitTranslation>;
  home?: KitHomePresentation;
}

export type KitWithProducts = Kit & { products: Product[] };
