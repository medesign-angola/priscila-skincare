import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductFacade } from '@org/core';
import { IngredientsSectionComponent } from '@org/shared';

@Component({selector:'app-ingredients-section',imports:[IngredientsSectionComponent],templateUrl:'./ingredients-section.html',styleUrl:'./ingredients-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class IngredientsSection { readonly section = inject(ProductFacade).homeIngredients; }
