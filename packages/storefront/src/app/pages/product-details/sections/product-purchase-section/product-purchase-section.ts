import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { HeaderService, Product, ProductFacade } from '@org/core';
import { PriceFormatPipe } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-product-purchase-section',
  imports: [PriceFormatPipe, TranslatePipe],
  templateUrl: './product-purchase-section.html',
  styleUrl: './product-purchase-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPurchaseSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  private readonly facade = inject(ProductFacade);
  readonly header = inject(HeaderService);
  readonly activeImageIndex = signal(0);
  readonly selectedSizeId = signal('');
  readonly translation = computed(() => this.product().translations[this.language()]);
  readonly category = computed(() => this.facade.mappedCategories().get(this.product().categoryId));
  readonly sizes = computed(() => this.facade.getProductSizes(this.product()));
  readonly activeImage = computed(() => this.product().images[this.activeImageIndex()] ?? this.product().thumbnailImage);
  readonly price = computed(() => this.product().commerce?.prices[this.header.currency()] ?? 0);

  selectImage(index: number): void { this.activeImageIndex.set(index); }
  formatIndex(index: number): string { return String(index + 1).padStart(2, '0'); }
  selectSize(event: Event): void { this.selectedSizeId.set((event.target as HTMLSelectElement).value); }
  addToCart(): void { console.log('Adicionar ao carrinho:', this.product().id, this.selectedSizeId()); }
}
