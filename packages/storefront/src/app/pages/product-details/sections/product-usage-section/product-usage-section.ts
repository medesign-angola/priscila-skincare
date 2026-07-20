import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Product } from '@org/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-product-usage-section',
  imports: [TranslatePipe],
  templateUrl: './product-usage-section.html',
  styleUrl: './product-usage-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductUsageSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  readonly content = computed(() => this.product().translations[this.language()].howToUse);
  readonly image = computed(() => this.content().editorialImage || this.product().translations[this.language()].benefits.mainImage);
}
