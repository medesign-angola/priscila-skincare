export type ProductReviewStatus = 'pending' | 'published' | 'rejected';

export interface ProductReview {
  id?: string;
  customerId?: string;
  name: string;
  title?: string;
  comment: string;
  rating: number;
  recommends?: boolean;
  status?: ProductReviewStatus;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductTranslation {
  name: string;
  description: string;
  additionalDescription?: string;
  editorial?: {
    headline: string;
    description: string;
    footnote: string;
  };
  galleryEditorial?: {
    headline: string;
    description: string;
  };
  highlights: string[];
  benefits: {
    mainImage: string;
    sections: {
      title: string;
      description: string;
      images?: string[];
    }[];
  };
  ingredients: {
    name: string;
    description: string;
    mainIngredientsImages: string[]; // max 2
    bodyResultImage: string;
    items?: {
      name: string;
      description: string;
      image?: string;
    }[];
    editorialImage?: string;
  };
  howToUse: {
    editorialImage?: string;
    steps: {
      order: number;
      name: string;
      description: string;
    }[];
  };
  result: {
    data: {
      percentage: number;
      description: string;
    }[];
    description: string;
    images: {
      before: string;
      after: string;
    };
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    userReviews: ProductReview[];
  };
}

export type ProductBadge =
  | { type: 'discount'; percentage: number }
  | { type: 'new' }
  | { type: 'coming-soon' };

export interface ProductCommerce {
  prices: { AOA: number; EUR: number };
  availability: 'in-stock' | 'coming-soon' | 'out-of-stock';
  badge?: ProductBadge;
}

export type ProductHomePlacement =
  | {
      type: 'featured-products';
      order: number;
    }
  | {
      type: 'editorial-cover';
      order: number;
      mediaType: 'image' | 'video';
      mediaUrl: string;
      placeholderUrl?: string;
      hasNoise?: boolean;
    }
  | {
      type: 'editorial-gallery';
      order: number;
      coverImage: string;
      imageIndexes: number[];
    };

export interface Product {
  id: string;
  sku: string;
  slug?: string;
  featured: boolean;
  featuredOrder?: number;
  categoryId: string;
  sizeIds: string[]; // references Size entity
  images: string[]; // e.g. ['/assets/images/products/product-1-1.png', ...]
  thumbnailImage: string;
  featuredImage?: string;
  commerce?: ProductCommerce;
  homePlacements?: ProductHomePlacement[];
  translations: {
    pt: ProductTranslation;
    fr: ProductTranslation;
  };
}
