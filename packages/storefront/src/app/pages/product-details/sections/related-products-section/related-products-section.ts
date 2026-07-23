import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import { CartFacade, HeaderService, Product, ProductFacade } from '@org/core';
import { formatPrice, ProductCard, ProductCardData } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-related-products-section',
  imports: [ProductCard, TranslatePipe],
  templateUrl: './related-products-section.html',
  styleUrl: './related-products-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatedProductsSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  private readonly facade = inject(ProductFacade);
  private readonly header = inject(HeaderService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartFacade);

  readonly products = computed<ProductCardData[]>(() =>
    this.facade
      .products()
      .filter(
        (candidate) =>
          candidate.id !== this.product().id &&
          candidate.categoryId === this.product().categoryId,
      )
      .slice(0, 3)
      .flatMap((candidate) => {
        const commerce = candidate.commerce;
        if (!commerce) return [];
        const language = this.language();
        const translation = candidate.translations[language];
        const category = this.facade
          .mappedCategories()
          .get(candidate.categoryId);
        return [
          {
            id: candidate.id,
            name: translation.name,
            description: translation.description,
            categoryLabel:
              category?.translations?.[language] ?? category?.name,
            imageUrl: candidate.images[0] ?? candidate.thumbnailImage,
            rating: translation.reviews.averageRating,
            totalReviews: translation.reviews.totalReviews,
            currencyLabel: this.header.currency() === 'AOA' ? 'Kz' : '€',
            priceLabel: formatPrice(
              commerce.prices[this.header.currency()],
              this.header.currency(),
              language,
              false,
            ),
            available: commerce.availability === 'in-stock',
            addedToCart: this.cart.items().some((item) => item.productId === candidate.id),
            badge: commerce.badge,
          },
        ];
      }),
  );

  openProduct(id: string): void {
    void this.router.navigate(['/produtos', id]);
  }

  addToCart(id: string): void {
    this.cart.add(id);
  }
}
