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

export interface Kit {
  id: string;
  name: string;
  collection: string; // Subtitle/Collection name
  description: string; // Kit description/tagline até 45 caracteres
  price: number;
  currency: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaStyle: 'split-right' | 'cover';
  placeholderUrl?: string; // Stretched low-res blurred loading placeholder
  productIds: string[]; // referenced products
  featured: boolean; // featured on homepage hero slider
  home?: KitHomePresentation;
}

export type KitWithProducts = Kit & { products: Product[] };
