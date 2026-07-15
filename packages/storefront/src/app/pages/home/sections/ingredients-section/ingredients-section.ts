import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ProductFacade } from '@org/core';

@Component({
  selector: 'app-ingredients-section',
  imports: [],
  templateUrl: './ingredients-section.html',
  styleUrl: './ingredients-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsSection {
  private readonly facade = inject(ProductFacade);

  readonly section = this.facade.homeIngredients;
  readonly selectedIngredientId = signal<string | null>(null);

  readonly activeIngredient = computed(() => {
    const section = this.section();
    if (!section) return null;

    const activeId = this.selectedIngredientId() ?? section.initialIngredientId;

    return (
      section.ingredients.find((ingredient) => ingredient.id === activeId) ??
      section.ingredients[0] ??
      null
    );
  });

  selectIngredient(ingredientId: string): void {
    this.selectedIngredientId.set(ingredientId);
  }
}
