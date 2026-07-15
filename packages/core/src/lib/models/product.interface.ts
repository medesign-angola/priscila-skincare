export interface ProductTranslation {
  name: string;
  description: string;
  additionalDescription?: string;
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

export interface Product {
  id: string;
  featured: boolean;
  featuredOrder?: number;
  categoryId: string;
  sizeIds: string[]; // references Size entity
  images: string[]; // e.g. ['/assets/images/products/product-1-1.png', ...]
  thumbnailImage: string;
  translations: {
    pt: ProductTranslation;
    fr: ProductTranslation;
  };
}
