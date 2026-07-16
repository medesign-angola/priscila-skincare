import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderService, ProductFacade } from '@org/core';
import { map } from 'rxjs';
import { ProductPurchaseSection } from './sections/product-purchase-section/product-purchase-section';
import { ShippingInformationSection } from './sections/shipping-information-section/shipping-information-section';
import { ProductBenefitsSection } from './sections/product-benefits-section/product-benefits-section';
import { ProductIngredientsSection } from './sections/product-ingredients-section/product-ingredients-section';
import { ProductUsageSection } from './sections/product-usage-section/product-usage-section';
import { ProductResultsSection } from './sections/product-results-section/product-results-section';
import { ProductReviewsSection } from './sections/product-reviews-section/product-reviews-section';
import { RelatedProductsSection } from './sections/related-products-section/related-products-section';

@Component({
  selector: 'app-product-details',
  imports: [
    RouterLink,
    ProductPurchaseSection,
    ShippingInformationSection,
    ProductBenefitsSection,
    ProductIngredientsSection,
    ProductUsageSection,
    ProductResultsSection,
    ProductReviewsSection,
    RelatedProductsSection,
  ],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly header = inject(HeaderService);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(ProductFacade);
  private readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('productId'))),
    { initialValue: null },
  );

  constructor() {
    const previousTheme = this.header.theme();
    this.header.theme.set('black');
    this.destroyRef.onDestroy(() => this.header.theme.set(previousTheme));
  }

  readonly product = computed(() => {
    const identifier = this.productId();
    if (!identifier) return null;
    return (
      this.facade
        .products()
        .find(
          (product) => product.id === identifier || product.slug === identifier,
        ) ?? null
    );
  });
}
