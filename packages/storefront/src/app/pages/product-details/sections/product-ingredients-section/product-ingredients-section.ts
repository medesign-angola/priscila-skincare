import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Product } from '@org/core';

@Component({
  selector: 'app-product-ingredients-section',
  imports: [],
  templateUrl: './product-ingredients-section.html',
  styleUrl: './product-ingredients-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductIngredientsSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  readonly content = computed(() => this.product().translations[this.language()].ingredients);
  readonly items = computed(() => this.content().items?.length ? this.content().items! : [{ name: this.content().name, description: this.content().description }, { name: 'Ativos complementares', description: this.content().description }]);
}
