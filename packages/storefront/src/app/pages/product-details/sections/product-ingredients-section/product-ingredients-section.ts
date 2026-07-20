import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Product } from '@org/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-product-ingredients-section',
  imports: [TranslatePipe],
  templateUrl: './product-ingredients-section.html',
  styleUrl: './product-ingredients-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductIngredientsSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  readonly content = computed(() => this.product().translations[this.language()].ingredients);
  readonly items = computed(() => this.content().items?.length ? this.content().items! : [{ name: this.content().name, description: this.content().description }, { name: '', description: this.content().description }]);
}
