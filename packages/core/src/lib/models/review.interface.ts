import { ProductReview, ProductReviewStatus } from './product.interface';

export interface ReviewSubmission {
  productSku?: string;
  rating: number;
  title: string;
  comment: string;
  recommends: boolean;
  locale: 'pt' | 'fr';
}

export interface CustomerProductReview extends ProductReview {
  id: string;
  productSku: string;
  title: string;
  recommends: boolean;
  status: ProductReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewPage {
  items: CustomerProductReview[];
  summary: { averageRating: number; totalReviews: number };
  page: number;
  pageSize: number;
  totalItems: number;
}
