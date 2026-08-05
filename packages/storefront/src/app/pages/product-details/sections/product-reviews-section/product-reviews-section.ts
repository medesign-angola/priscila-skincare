import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  AuthFacade,
  Product,
  ProductReview,
  ReviewFacade,
} from '@org/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

interface ReviewListItem extends ProductReview {
  isOwn: boolean;
}

@Component({
  selector: 'app-product-reviews-section',
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './product-reviews-section.html',
  styleUrl: './product-reviews-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductReviewsSection {
  private readonly auth = inject(AuthFacade);
  private readonly reviewFacade = inject(ReviewFacade);

  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  readonly expanded = signal(false);
  readonly reviews = computed(
    () => {
      const api = this.reviewFacade.pageFor(this.product().sku);
      return api ? {
        averageRating: api.summary.averageRating,
        totalReviews: api.summary.totalReviews,
        userReviews: api.items,
      } : this.product().translations[this.language()].reviews;
    },
  );
  readonly ownReview = computed(() => {
    return this.auth.customer()
      ? this.reviewFacade.reviewForCustomer(this.product().sku)
      : undefined;
  });
  readonly visibleReviews = computed<ReviewListItem[]>(() => {
    const publicReviews = this.expanded()
      ? this.reviews().userReviews
      : this.reviews().userReviews.slice(0, 4);
    const ownReview = this.ownReview();
    const items = publicReviews.filter((review) => review.id !== ownReview?.id).map((review) => ({
      ...review,
      isOwn: false,
    }));

    return ownReview
      ? [{ ...ownReview, isOwn: true }, ...items]
      : items;
  });
  readonly reviewRoute = computed(() => [
    '/produtos',
    this.product().slug ?? this.product().id,
    'avaliar',
  ]);

  constructor() {
    effect(() => {
      const sku = this.product().sku;
      void this.reviewFacade.load(sku, this.auth.isAuthenticated(), 1, this.expanded() ? 50 : 4);
    });
  }

  formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  wasEdited(review: ProductReview): boolean {
    return !!review.editedAt;
  }

  reviewDate(review: ProductReview): string {
    return (this.wasEdited(review) ? review.editedAt : review.createdAt)
      ?? review.date
      ?? '';
  }

  toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }
}
