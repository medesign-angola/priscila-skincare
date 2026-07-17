export interface Ingredient {
  id: string;
  thumbnailImage: string;
  editorialImage: string;
  editorialPosition?: string;
  translations: {
    pt: { name: string };
    fr: { name: string };
  };
}

export interface HomeIngredientsPresentation {
  ingredientIds: string[];
  initialIngredientId: string;
  translations: {
    pt: HomeIngredientsTranslation;
    fr: HomeIngredientsTranslation;
  };
}

export interface HomeIngredientsTranslation {
  headline: string;
  description: string;
  footnote: string;
}
