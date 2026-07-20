import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Product } from '@org/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-product-benefits-section',
  imports: [TranslatePipe],
  templateUrl: './product-benefits-section.html',
  styleUrl: './product-benefits-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductBenefitsSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  readonly content = computed(() => this.product().translations[this.language()].benefits);
}
