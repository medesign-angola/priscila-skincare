export interface CollectionMedia {
  type: 'image' | 'video';
  url: string;
  posterUrl?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailImage: string;
  productIds: string[];
  media?: CollectionMedia;
}
