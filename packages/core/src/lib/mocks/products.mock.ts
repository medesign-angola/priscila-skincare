import { Product } from '../models/product.interface';

// Reusable default structures for products 4-14 to keep code elegant and maintainable
const DEFAULT_BENEFITS = {
  mainImage: '/assets/images/benefits-snow-white.png',
  sections: [
    {
      title: 'Nutrição Completa',
      description: 'Ajuda a restaurar o equilíbrio natural e a suavidade da pele.',
    },
  ],
};

const DEFAULT_BENEFITS_FR = {
  mainImage: '/assets/images/benefits-snow-white.png',
  sections: [
    {
      title: 'Nutrition Complète',
      description: 'Aide à restaurer l’équilibre naturel et la douceur de la peau.',
    },
  ],
};

const DEFAULT_INGREDIENTS = {
  name: 'Ingredientes Naturais Ativos',
  description: 'Fórmula enriquecida com vitaminas essenciais e extratos botânicos.',
  mainIngredientsImages: ['/assets/images/ingredient-peony.png'],
  bodyResultImage: '/assets/images/result-body-peony.png',
};

const DEFAULT_INGREDIENTS_FR = {
  name: 'Ingrédients Naturels Actifs',
  description: 'Formule enrichie en vitamines essentielles et extraits botaniques.',
  mainIngredientsImages: ['/assets/images/ingredient-peony.png'],
  bodyResultImage: '/assets/images/result-body-peony.png',
};

const DEFAULT_HOW_TO_USE = {
  steps: [
    {
      order: 1,
      name: 'Aplicar na Pele',
      description: 'Aplique uniformemente na área desejada massageando suavemente.',
    },
  ],
};

const DEFAULT_HOW_TO_USE_FR = {
  steps: [
    {
      order: 1,
      name: 'Appliquer sur la Peau',
      description: 'Appliquez uniformément sur la zone souhaitée en massant doucement.',
    },
  ],
};

const DEFAULT_RESULT = {
  data: [
    { percentage: 90, description: 'dos utilizadores relataram melhoria na textura da pele.' },
  ],
  description: 'Resultados visíveis comprovados após 2 semanas de uso contínuo.',
  images: {
    before: '/assets/images/results-before-1.png',
    after: '/assets/images/results-after-1.png',
  },
};

const DEFAULT_RESULT_FR = {
  data: [
    { percentage: 90, description: 'des utilisateurs ont constaté une amélioration de la texture.' },
  ],
  description: 'Résultats visibles prouvés après 2 semaines d’utilisation continue.',
  images: {
    before: '/assets/images/results-before-1.png',
    after: '/assets/images/results-after-1.png',
  },
};

const DEFAULT_REVIEWS = {
  averageRating: 4.8,
  totalReviews: 12,
  userReviews: [
    { name: 'Utilizador Verificado', comment: 'Excelente qualidade, recomendo vivamente.', rating: 5 },
  ],
};

const DEFAULT_REVIEWS_FR = {
  averageRating: 4.8,
  totalReviews: 12,
  userReviews: [
    { name: 'Utilisateur Vérifié', comment: 'Excellente qualité, je recommande vivement.', rating: 5 },
  ],
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: [
      '/assets/images/products/product-1-1.png',
      '/assets/images/products/product-1-2.png',
      '/assets/images/products/product-1-3.png',
      '/assets/images/products/product-1-4.png',
    ],
    translations: {
      pt: {
        name: 'Snow White Soap',
        description: 'Sabonete purificante de uso diário que limpa profundamente mantendo a hidratação.',
        highlights: ['Limpeza Profunda', 'Ação Suave', 'Nutrição Diária'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Snow White Soap',
        description: 'Savon purifiant à usage quotidien qui nettoie en profondeur tout en maintenant l’hydratation.',
        highlights: ['Nettoyage Profond', 'Action Douce', 'Nutrition Quotidienne'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-2',
    categoryId: 'cat-1',
    sizeIds: ['size-100ml'],
    images: [
      '/assets/images/products/product-2-1.png',
      '/assets/images/products/product-2-2.png',
      '/assets/images/products/product-2-3.png',
      '/assets/images/products/product-2-4.png',
    ],
    translations: {
      pt: {
        name: 'Polish Body Scrub',
        description: 'Esfoliante corporal revigorante que remove células mortas e suaviza a textura da pele.',
        highlights: ['Esfoliação Ativa', 'Pele Macia', 'Toque Sedoso'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Polish Body Scrub',
        description: 'Gommage corporel revigorant qui élimine les cellules mortes et lisse le grain de peau.',
        highlights: ['Exfoliation Active', 'Peau Douce', 'Toucher Soyeux'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-3',
    categoryId: 'cat-2',
    sizeIds: ['size-200ml'],
    images: [
      '/assets/images/products/product-3-1.png',
      '/assets/images/products/product-3-2.png',
      '/assets/images/products/product-3-3.png',
      '/assets/images/products/product-3-4.png',
    ],
    translations: {
      pt: {
        name: 'Snow White Body Cream',
        description: 'Creme corporal hidratante intenso que restaura a barreira lipídica natural.',
        highlights: ['Hidratação Corporal', 'Absorção Rápida', 'Toque Acetinado'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Snow White Body Cream',
        description: 'Crème corporelle hydratante intense qui restaure la barrière lipidique naturelle.',
        highlights: ['Hydratation Corporelle', 'Absorption Rapide', 'Fini Satiné'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-4',
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-4-1.png'],
    translations: {
      pt: {
        name: 'Snow White Face Cream',
        description: 'Creme facial hidratante e iluminador profundo que devolve a luminosidade natural.',
        highlights: ['Luminosidade', 'Antioxidante', 'Uso Diário'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Snow White Face Cream',
        description: 'Crème visage hydratante et illuminatrice profonde qui redonne de l’éclat.',
        highlights: ['Éclat', 'Antioxydant', 'Usage Quotidien'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-5',
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-5-1.png'],
    translations: {
      pt: {
        name: 'Pris Caramel Face Cream',
        description: 'Creme facial firmador enriquecido com extrato de caramelo para vitalidade.',
        highlights: ['Firmeza', 'Nutrição Facial', 'Toque Aveludado'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Pris Caramel Face Cream',
        description: 'Crème visage raffermissante enrichie en extrait de caramel pour la vitalité.',
        highlights: ['Fermeté', 'Nutrition Visage', 'Fini Velouté'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-6',
    categoryId: 'cat-2',
    sizeIds: ['size-200ml'],
    images: ['/assets/images/products/product-6-1.png'],
    translations: {
      pt: {
        name: 'Caramel Body Cream',
        description: 'Creme corporal reconfortante com fragrância doce e hidratação prolongada.',
        highlights: ['Hidratação 24h', 'Aroma Doce', 'Nutrição'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Caramel Body Cream',
        description: 'Crème corporelle réconfortante au parfum sucré et hydratation prolongée.',
        highlights: ['Hydratation 24h', 'Parfum Sucré', 'Nutrition'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-7',
    categoryId: 'cat-1',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-7-1.png'],
    translations: {
      pt: {
        name: 'Flora Carrot Soap',
        description: 'Sabonete vegetal de cenoura rico em beta-caroteno para vitalidade cutânea.',
        highlights: ['Sabonete Vegetal', 'Beta-Caroteno', 'Luminosidade'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Flora Carrot Soap',
        description: 'Savon végétal à la carotte riche en bêta-carotène pour la vitalité cutanée.',
        highlights: ['Savon Végétal', 'Bêta-Carotène', 'Éclat du Teint'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-8',
    categoryId: 'cat-1',
    sizeIds: ['size-100ml'],
    images: ['/assets/images/products/product-8-1.png'],
    translations: {
      pt: {
        name: 'Carrot Soap 150g',
        description: 'Sabonete purificante de cenoura em barra para cuidado diário de peles baças.',
        highlights: ['Barra de Cenoura', 'Ação Purificante', 'Vitalidade'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Carrot Soap 150g',
        description: 'Savon purifiant à la carotte en pain pour le soin quotidien des peaux ternes.',
        highlights: ['Pain de Carotte', 'Action Purifiante', 'Vitalité'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-9',
    categoryId: 'cat-3',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-9-1.png'],
    translations: {
      pt: {
        name: 'Pink Lip Balm',
        description: 'Bálsamo labial hidratante que confere um tom rosado natural e proteção contra o ressecamento.',
        highlights: ['Brilho Rosado', 'Hidratação de Lábios', 'Proteção'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Pink Lip Balm',
        description: 'Baume à lèvres hydratant offrant un fini rosé naturel et une protection contre le dessèchement.',
        highlights: ['Brillance Rosée', 'Hydratation Lèvres', 'Protection'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-10',
    categoryId: 'cat-3',
    sizeIds: ['size-100ml'],
    images: ['/assets/images/products/product-10-1.png'],
    translations: {
      pt: {
        name: 'Aktive Clear Soluciona',
        description: 'Tratamento direcionado para imperfeições faciais e regulação de oleosidade.',
        highlights: ['Controlo de Imperfeições', 'Antioleosidade', 'Ação Rápida'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Aktive Clear Soluciona',
        description: 'Soin ciblé pour les imperfections du visage et régulation du sébum.',
        highlights: ['Contrôle des Imperfections', 'Anti-Sébum', 'Action Rapide'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-11',
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-11-1.png'],
    translations: {
      pt: {
        name: 'Aldnira Face Scrub',
        description: 'Esfoliante facial suave para renovação celular e desobstrução de poros.',
        highlights: ['Esfoliação Facial', 'Renovação Celular', 'Poros Limpos'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Aldnira Face Scrub',
        description: 'Gommage visage doux pour le renouvellement cellulaire et la purification des pores.',
        highlights: ['Gommage Visage', 'Renouvellement Celulaire', 'Pores Purifiés'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-12',
    categoryId: 'cat-3',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-12-1.png'],
    translations: {
      pt: {
        name: 'Dark Spot Removal',
        description: 'Tratamento intensivo localizado para redução gradual de manchas escuras e hiperpigmentação.',
        highlights: ['Remoção de Manchas', 'Tonalidade Equilibrada', 'Intensivo'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Dark Spot Removal',
        description: 'Soin ciblé intensif pour atténuer progressivement les taches brunes et l’hyperpigmentation.',
        highlights: ['Anti-Taches Brunes', 'Teint Unifié', 'Intensif'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-13',
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-13-1.png'],
    translations: {
      pt: {
        name: 'Vitamin C Serum Anti-Aging',
        description: 'Sérum de vitamina C ativa para luminosidade extrema e prevenção de linhas de expressão.',
        highlights: ['Vitamina C Ativa', 'Prevenção de Idade', 'Antioxidante'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Vitamin C Serum Anti-Aging',
        description: 'Sérum à la vitamine C active pour un éclat extrême et prévention des ridules.',
        highlights: ['Vitamine C Active', 'Anti-Âge', 'Antioxydant'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
  {
    id: 'prod-14',
    categoryId: 'cat-2',
    sizeIds: ['size-100ml'],
    images: ['/assets/images/products/product-14-1.png'],
    translations: {
      pt: {
        name: 'Sunscreen SPF50 100g',
        description: 'Protetor solar facial e corporal de amplo espetro contra raios UVA/UVB e envelhecimento precoce.',
        highlights: ['Proteção SPF50', 'Fórmula Leve', 'UVA/UVB'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Sunscreen SPF50 100g',
        description: 'Protecteur solaire visage et corps à large spectre contre les UVA/UVB.',
        highlights: ['Protection SPF50', 'Formule Légère', 'UVA/UVB'],
        benefits: DEFAULT_BENEFITS_FR,
        ingredients: DEFAULT_INGREDIENTS_FR,
        howToUse: DEFAULT_HOW_TO_USE_FR,
        result: DEFAULT_RESULT_FR,
        reviews: DEFAULT_REVIEWS_FR,
      },
    },
  },
];
