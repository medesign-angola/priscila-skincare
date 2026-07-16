import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { HeaderService, ProductFacade } from '@org/core';
import { formatPrice, ProductCard, ProductCardData } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-featured-products-section',
  imports: [ProductCard, TranslatePipe],
  templateUrl: './featured-products-section.html',
  styleUrl: './featured-products-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsSection {
  private readonly facade = inject(ProductFacade);
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);

  readonly products = computed<ProductCardData[]>(() => {
    const language = this.facade.currentLanguage();
    const currency = this.headerService.currency();
    return this.facade.featuredProducts().flatMap((product) => {
      const commerce = product.commerce;
      if (!commerce) return [];

      const translation = product.translations[language];
      return [
        {
          id: product.id,
          name: translation.name,
          description: translation.description,
          imageUrl: product.featuredImage ?? product.images[0],
          rating: translation.reviews.averageRating,
          totalReviews: translation.reviews.totalReviews,
          currencyLabel: currency === 'AOA' ? 'Kz' : '€',
          priceLabel: formatPrice(
            commerce.prices[currency],
            currency,
            language,
            false,
          ),
          available: commerce.availability === 'in-stock',
          badge: commerce.badge,
        },
      ];
    });
  });

  selectProduct(productId: string): void {
    void this.router.navigate(['/produtos', productId]);
  }

  addToCart(productId: string): void {
    console.log('Adicionar ao carrinho:', productId);
  }
}
