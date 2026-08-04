import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
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
  readonly expanded = signal(false);
  readonly content = computed(
    () => this.product().translations[this.language()].ingredients,
  );
  readonly items = computed(() =>
    this.content().items?.length
      ? this.content().items!
      : [
          {
            name: this.content().name,
            description: this.content().description,
          },
          { name: '', description: this.content().description },
        ],
  );
  readonly hasHiddenItems = computed(() => this.items().length > 4);
  readonly visibleItems = computed(() =>
    this.expanded() ? this.items() : this.items().slice(0, 4),
  );
  readonly ingredientRows = computed(() =>
    Math.max(1, Math.ceil(this.visibleItems().length / 2)),
  );

  toggleIngredients(): void {
    this.expanded.update((expanded) => !expanded);
  }
}
