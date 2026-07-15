import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { HeaderService, ProductFacade } from '@org/core';
import { ProductCard, ProductCardData } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

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

  readonly products = computed<ProductCardData[]>(() => {
    const language = this.facade.currentLanguage();
    const currency = this.headerService.currency();
    const formatter = new Intl.NumberFormat(
      language === 'pt' ? 'pt-AO' : 'fr-FR',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    );

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
          priceLabel: formatter.format(commerce.prices[currency]),
          available: commerce.availability === 'in-stock',
          badge: commerce.badge,
        },
      ];
    });
  });

  selectProduct(productId: string): void {
    console.log('Abrir produto:', productId);
  }

  addToCart(productId: string): void {
    console.log('Adicionar ao carrinho:', productId);
  }
}
