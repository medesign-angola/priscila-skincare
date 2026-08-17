import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CartFacade, HeaderService, Product, ProductFacade } from '@org/core';
import { PriceFormatPipe } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductGallery } from '../../../../components/product-gallery';

@Component({
  selector: 'app-product-purchase-section',
  imports: [PriceFormatPipe, TranslatePipe, ProductGallery],
  templateUrl: './product-purchase-section.html',
  styleUrl: './product-purchase-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPurchaseSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  private readonly facade = inject(ProductFacade);
  readonly header = inject(HeaderService);
  private readonly cart = inject(CartFacade);
  readonly selectedSizeId = signal('');
  readonly detailsExpanded = signal(false);
  readonly translation = computed(() => this.product().translations[this.language()]);
  readonly category = computed(() => this.facade.mappedCategories().get(this.product().categoryId));
  readonly sizes = computed(() => this.facade.getProductSizes(this.product()));
  readonly price = computed(() => this.product().commerce?.prices[this.header.currency()] ?? 0);
  readonly addedToCart = computed(() =>
    this.cart.items().some((item) => item.productId === this.product().id),
  );

  toggleDetails(): void { this.detailsExpanded.update((expanded) => !expanded); }
  selectSize(event: Event): void { this.selectedSizeId.set((event.target as HTMLSelectElement).value); }
  addToCart(): void { this.cart.add(this.product().id, this.selectedSizeId() || undefined); }
}
