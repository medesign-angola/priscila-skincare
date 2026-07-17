import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface IngredientsSectionData {
  headline: string;
  description: string;
  footnote: string;
  initialIngredientId: string;
  ingredients: readonly {
    id: string;
    index: string;
    name: string;
    thumbnailImage: string;
    editorialImage: string;
    editorialPosition: string;
  }[];
}

@Component({
  selector: 'org-ingredients-section',
  imports: [],
  templateUrl: './ingredients-section.html',
  styleUrl: './ingredients-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsSectionComponent {
  readonly section = input.required<IngredientsSectionData>();
  readonly selectedIngredientId = signal<string | null>(null);
  readonly activeIngredient = computed(() => {
    const section = this.section();
    const activeId = this.selectedIngredientId() ?? section.initialIngredientId;
    return section.ingredients.find((item) => item.id === activeId) ?? section.ingredients.at(0) ?? null;
  });

  selectIngredient(id: string): void { this.selectedIngredientId.set(id); }
}
