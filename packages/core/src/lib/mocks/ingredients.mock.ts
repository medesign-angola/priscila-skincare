import {
  HomeIngredientsPresentation,
  Ingredient,
} from '../models/ingredient.interface';

const image = (name: string, type: 'thumbnails' | 'editorial') =>
  `/assets/images/ingredients/${type}/${name}.webp`;

export const MOCK_INGREDIENTS: Ingredient[] = [
  ingredient('hydroxyapatite', 'Hidroxiapatita', 'Hydroxyapatite'),
  ingredient('papain', 'Papaína', 'Papaïne'),
  ingredient('clove-oil', 'Óleo de cravo', 'Huile de clou de girofle'),
  ingredient('xylitol', 'Xilitol', 'Xylitol'),
  ingredient('copper', 'Cobre', 'Cuivre'),
  ingredient('neem', 'Neem', 'Neem'),
  ingredient('bromelain', 'Bromelaína', 'Bromélaïne'),
  ingredient('coconut-oil', 'Óleo de coco', 'Huile de coco'),
  ingredient('parsley', 'Salsinha', 'Persil'),
];

export const MOCK_HOME_INGREDIENTS: HomeIngredientsPresentation = {
  ingredientIds: MOCK_INGREDIENTS.map(({ id }) => id),
  initialIngredientId: 'hydroxyapatite',
  translations: {
    pt: {
      headline:
        'Nossos produtos têm uma composição segura e garantida para cuidar e proteger a sua pele.',
      description:
        'Nossos produtos combinam ingredientes cuidadosamente selecionados para oferecer uma pele uniforme, radiante e protegida.',
      footnote:
        'Cada fórmula reforça a barreira natural da pele, garantindo hidratação e luminosidade duradoura.',
    },
    fr: {
      headline:
        'Nos produits présentent une composition sûre et fiable pour prendre soin de votre peau et la protéger.',
      description:
        'Nos produits associent des ingrédients soigneusement sélectionnés pour offrir une peau uniforme, lumineuse et protégée.',
      footnote:
        'Chaque formule renforce la barrière naturelle de la peau pour une hydratation et une luminosité durables.',
    },
  },
};

function ingredient(id: string, pt: string, fr: string): Ingredient {
  return {
    id,
    thumbnailImage: image(id, 'thumbnails'),
    editorialImage: image(id, 'editorial'),
    editorialPosition: id === 'hydroxyapatite' ? 'center 72%' : 'center',
    translations: { pt: { name: pt }, fr: { name: fr } },
  };
}
