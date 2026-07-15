export interface ProductTranslation {
  name: string;
  description: string;
  additionalDescription?: string;
  editorial?: {
    headline: string;
    description: string;
    footnote: string;
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
  };
  howToUse: {
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
    userReviews: {
      name: string;
      comment: string;
      rating: number;
      date?: string;
    }[];
  };
}

export type ProductBadge =
  | { type: 'discount'; percentage: number }
  | { type: 'new' }
  | { type: 'coming-soon' };

export interface ProductCommerce {
  prices: { AOA: number; EUR: number };
  availability: 'in-stock' | 'coming-soon';
  badge?: ProductBadge;
}

export interface Product {
  id: string;
  featured: boolean;
  featuredOrder?: number;
  categoryId: string;
  sizeIds: string[]; // references Size entity
  images: string[]; // e.g. ['/assets/images/products/product-1-1.png', ...]
  thumbnailImage: string;
  featuredImage?: string;
  commerce?: ProductCommerce;
  homeEditorial?: {
    order: number;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    placeholderUrl?: string;
    hasNoise?: boolean;
  };
  translations: {
    pt: ProductTranslation;
    fr: ProductTranslation;
  };
}
