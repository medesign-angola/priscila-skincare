export interface HomePageConfiguration {
  featuredProductIds: Record<'pt' | 'fr', string[]>;
  editorialCover: Record<
    'pt' | 'fr',
    {
      productId: string;
      mediaType: 'image' | 'video';
      mediaUrl: string;
      placeholderUrl?: string;
      hasNoise?: boolean;
    } | null
  >;
  editorialGalleryProductIds: Record<'pt' | 'fr', string | null>;
  featuredKitIds: Record<'pt' | 'fr', string | null>;
  featuredCollectionIds: Record<'pt' | 'fr', string | null>;
  brandPillars: Record<
    'pt' | 'fr',
    {
      title: string;
      items: { order: number; title: string; description: string }[];
    } | null
  >;
}
