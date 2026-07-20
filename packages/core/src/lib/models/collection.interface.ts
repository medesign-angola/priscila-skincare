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

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailImage: string;
  productIds: string[];
  translations: Record<'pt' | 'fr', CollectionTranslation>;
  media?: CollectionMedia;
  home?: CollectionHomePresentation;
}
