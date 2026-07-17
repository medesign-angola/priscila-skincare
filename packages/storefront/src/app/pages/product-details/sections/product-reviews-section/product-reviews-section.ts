import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { Product } from '@org/core';

@Component({
  selector: 'app-product-reviews-section',
  imports: [],
  templateUrl: './product-reviews-section.html',
  styleUrl: './product-reviews-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductReviewsSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  readonly expanded = signal(false);
  readonly reviews = computed(
    () => this.product().translations[this.language()].reviews,
  );
  readonly visibleReviews = computed(() =>
    this.expanded()
      ? this.reviews().userReviews
      : this.reviews().userReviews.slice(0, 4),
  );

  formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
