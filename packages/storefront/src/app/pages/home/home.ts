import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderService, ProductFacade } from '@org/core';
import {
  HeroSplitComponent,
  HeroCoverComponent,
  ProductCard,
  ProductCardData,
} from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSplitComponent,
    HeroCoverComponent,
    ProductCard,
    TranslatePipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  readonly facade = inject(ProductFacade);
  readonly headerService = inject(HeaderService);
  readonly brandPillars = [
    {
      titleKey: 'HOME.BRAND_PILLARS.ACTIVE_FORMULAS.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.ACTIVE_FORMULAS.DESCRIPTION',
    },
    {
      titleKey: 'HOME.BRAND_PILLARS.SENSITIVE_SKIN.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.SENSITIVE_SKIN.DESCRIPTION',
    },
    {
      titleKey: 'HOME.BRAND_PILLARS.MADE_IN_FRANCE.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.MADE_IN_FRANCE.DESCRIPTION',
    },
    {
      titleKey: 'HOME.BRAND_PILLARS.SAFETY_CERTIFIED.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.SAFETY_CERTIFIED.DESCRIPTION',
    },
  ] as const;

  readonly featuredProductCards = computed<ProductCardData[]>(() => {
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

  onBuy(productId: string) {
    console.log('Comprar produto:', productId);
  }

  onProductSelect(productId: string): void {
    console.log('Abrir produto:', productId);
  }

  onAddToCart(productId: string): void {
    console.log('Adicionar ao carrinho:', productId);
  }
}
