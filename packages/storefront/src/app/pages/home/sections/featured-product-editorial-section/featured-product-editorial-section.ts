import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { HeaderService, ProductFacade } from '@org/core';
import { HeroCoverComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

interface EditorialProductViewModel {
  id: string;
  name: string;
  headline: string;
  description: string;
  footnote: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  placeholderUrl?: string;
  hasNoise: boolean;
  currencyLabel: string;
  priceLabel: string;
  available: boolean;
}

@Component({
  selector: 'app-featured-product-editorial-section',
  imports: [HeroCoverComponent, TranslatePipe],
  templateUrl: './featured-product-editorial-section.html',
  styleUrl: './featured-product-editorial-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductEditorialSection {
  private readonly facade = inject(ProductFacade);
  private readonly headerService = inject(HeaderService);

  readonly product = computed<EditorialProductViewModel | null>(() => {
    const product = this.facade.homeEditorialProducts()[0];
    const language = this.facade.currentLanguage();
    const currency = this.headerService.currency();
    const editorial = product?.translations[language].editorial;
    const presentation = product?.homeEditorial;
    const commerce = product?.commerce;

    if (!product || !editorial || !presentation || !commerce) return null;

    const formatter = new Intl.NumberFormat(
      language === 'pt' ? 'pt-AO' : 'fr-FR',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    );

    return {
      id: product.id,
      name: product.translations[language].name,
      headline: editorial.headline,
      description: editorial.description,
      footnote: editorial.footnote,
      mediaType: presentation.mediaType,
      mediaUrl: presentation.mediaUrl,
      placeholderUrl: presentation.placeholderUrl,
      hasNoise: presentation.hasNoise ?? false,
      currencyLabel: currency === 'AOA' ? 'Kz' : '€',
      priceLabel: formatter.format(commerce.prices[currency]),
      available: commerce.availability === 'in-stock',
    };
  });

  addToCart(productId: string): void {
    console.log('Adicionar produto ao carrinho:', productId);
  }
}
