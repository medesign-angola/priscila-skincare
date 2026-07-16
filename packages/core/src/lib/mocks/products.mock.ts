import { Product, ProductCommerce } from '../models/product.interface';

const commerce = (
  aoaPrice: number,
  availability: ProductCommerce['availability'] = 'in-stock',
): ProductCommerce => ({
  prices: { AOA: aoaPrice, EUR: aoaPrice / 1000 },
  availability,
});

// Reusable default structures for products 4-14 to keep code elegant and maintainable
const DEFAULT_BENEFITS = {
  mainImage: '/assets/images/product-details/prod-1/benefits-main.webp',
  sections: [
    {
      title: 'Proteção Diária Essencial',
      description:
        'Ajuda a proteger a pele contra os efeitos causados pela exposição aos raios solares, contribuindo para a manutenção de uma aparência saudável.',
      images: [
        '/assets/images/product-details/prod-1/benefits-detail-1.webp',
        '/assets/images/product-details/prod-1/benefits-detail-2.webp',
        '/assets/images/product-details/prod-1/benefits-detail-3.webp',
      ],
    },
    {
      title: 'Prevenção do Envelhecimento Precoce',
      description:
        'O uso diário ajuda a minimizar os impactos externos que podem acelerar o aparecimento de linhas finas e alterações no tom da pele.',
    },
    {
      title: 'Hidratação e Conforto',
      description:
        'Mantém a pele confortável ao longo do dia sem comprometer a sensação de leveza.',
    },
    {
      title: 'Acabamento Natural',
      description:
        'Desenvolvido para proporcionar um aspecto natural e uniforme, sem resíduos visíveis.',
    },
  ],
};

const DEFAULT_BENEFITS_FR = {
  mainImage: '/assets/images/product-details/prod-1/benefits-main.webp',
  sections: [
    {
      title: 'Nutrition Complète',
      description:
        'Aide à restaurer l’équilibre naturel et la douceur de la peau.',
    },
  ],
};

const DEFAULT_INGREDIENTS = {
  name: 'Óxido de Zinco',
  description:
    'Rico em aminoácidos essenciais que trabalham em sinergia para revitalizar e estimular a regeneração celular da pele.',
  mainIngredientsImages: [
    '/assets/images/product-details/prod-1/ingredient-zinc.webp',
    '/assets/images/product-details/prod-1/ingredient-avobenzone.webp',
  ],
  editorialImage:
    '/assets/images/product-details/prod-1/ingredients-editorial.webp',
  bodyResultImage:
    '/assets/images/product-details/prod-1/ingredients-editorial.webp',
  items: [
    {
      name: 'Óxido de Zinco',
      description:
        'Ajuda a formar uma barreira protetora na pele e contribui para a proteção contra a radiação solar.',
    },
    {
      name: 'Avobenzona',
      description:
        'Filtro solar que auxilia na proteção da pele contra os raios UVA.',
    },
    {
      name: 'Dióxido de Titânio',
      description:
        'Ingrediente mineral que reforça a proteção e ajuda a manter a pele confortável.',
    },
    {
      name: 'Octocrileno',
      description:
        'Contribui para a estabilidade da fórmula e para uma proteção solar uniforme.',
    },
  ],
};

const DEFAULT_INGREDIENTS_FR = {
  name: 'Ingrédients Naturels Actifs',
  description:
    'Formule enrichie en vitamines essentielles et extraits botaniques.',
  mainIngredientsImages: [
    '/assets/images/product-details/prod-1/ingredient-zinc.webp',
    '/assets/images/product-details/prod-1/ingredient-avobenzone.webp',
  ],
  editorialImage:
    '/assets/images/product-details/prod-1/ingredients-editorial.webp',
  bodyResultImage:
    '/assets/images/product-details/prod-1/ingredients-editorial.webp',
};

const DEFAULT_HOW_TO_USE = {
  editorialImage: '/assets/images/product-details/prod-1/usage-editorial.webp',
  steps: [
    {
      order: 1,
      name: 'Limpeza',
      description:
        'Inicie com a pele limpa e seca, garantindo que não haja resíduos de maquiagem ou impurezas.',
    },
    {
      order: 2,
      name: 'Aplicação',
      description:
        'Aplique uma quantidade generosa do produto em todo o rosto e pescoço, evitando a área dos olhos.',
    },
    {
      order: 3,
      name: 'Distribuição',
      description:
        'Espalhe o produto uniformemente, massageando suavemente até que seja completamente absorvido.',
    },
    {
      order: 4,
      name: 'Reaplicação',
      description:
        'Reaplique a cada duas horas ou após nadar, suar excessivamente ou secar-se com toalha.',
    },
  ],
};

const DEFAULT_HOW_TO_USE_FR = {
  steps: [
    {
      order: 1,
      name: 'Appliquer sur la Peau',
      description:
        'Appliquez uniformément sur la zone souhaitée en massant doucement.',
    },
  ],
};

const DEFAULT_RESULT = {
  data: [
    {
      percentage: 95,
      description:
        'dos participantes notaram uma redução visível na vermelhidão e irritação da pele.',
    },
    {
      percentage: 81,
      description: 'dos participantes aprovaram o conforto do produto.',
    },
    {
      percentage: 62,
      description:
        'dos utilizadores sentiram-se confortáveis com a utilização diária.',
    },
  ],
  description:
    'O estudo envolveu 21 mulheres, incluindo 9 com pele sensível. Os resultados foram recolhidos após 28 dias de uso contínuo.',
  images: {
    before: '/assets/images/product-details/prod-1/results-comparison.webp',
    after: '/assets/images/product-details/prod-1/results-comparison.webp',
  },
};

const DEFAULT_RESULT_FR = {
  data: [
    {
      percentage: 90,
      description:
        'des utilisateurs ont constaté une amélioration de la texture.',
    },
  ],
  description:
    'Résultats visibles prouvés après 2 semaines d’utilisation continue.',
  images: {
    before: '/assets/images/product-details/prod-1/results-comparison.webp',
    after: '/assets/images/product-details/prod-1/results-comparison.webp',
  },
};

const DEFAULT_REVIEWS = {
  averageRating: 4.8,
  totalReviews: 12,
  userReviews: [
    {
      name: 'Utilizador Verificado',
      comment: 'Excelente qualidade, recomendo vivamente.',
      rating: 5,
    },
  ],
};

const DEFAULT_REVIEWS_FR = {
  averageRating: 4.8,
  totalReviews: 12,
  userReviews: [
    {
      name: 'Utilisateur Vérifié',
      comment: 'Excellente qualité, je recommande vivement.',
      rating: 5,
    },
  ],
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    featured: true,
    featuredOrder: 1,
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: [
      '/assets/images/products/product-1-1.webp',
      '/assets/images/products/product-1-2.webp',
      '/assets/images/products/product-1-3.webp',
      '/assets/images/products/product-1-4.webp',
    ],
    thumbnailImage: '/assets/images/products/thumbnails/product-1.webp',
    featuredImage: '/assets/images/products/featured/product-1.webp',
    commerce: {
      prices: { AOA: 270000, EUR: 270 },
      availability: 'in-stock',
      badge: { type: 'discount', percentage: 50 },
    },
    translations: {
      pt: {
        name: 'Snow White Soap',
        description:
          'Sabonete purificante de uso diário que limpa profundamente mantendo a hidratação.',
        highlights: ['Limpeza Profunda', 'Ação Suave', 'Nutrição Diária'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Snow White Soap',
        description:
          'Savon purifiant à usage quotidien qui nettoie en profondeur tout en maintenant l’hydratation.',
        highlights: [
          'Nettoyage Profond',
          'Action Douce',
          'Nutrition Quotidienne',
        ],
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
    featured: true,
    featuredOrder: 2,
    categoryId: 'cat-1',
    sizeIds: ['size-100ml'],
    images: [
      '/assets/images/products/product-2-1.webp',
      '/assets/images/products/product-2-2.webp',
      '/assets/images/products/product-2-3.webp',
      '/assets/images/products/product-2-4.webp',
    ],
    thumbnailImage: '/assets/images/products/thumbnails/product-2.webp',
    featuredImage: '/assets/images/products/featured/product-2.webp',
    commerce: {
      prices: { AOA: 270000, EUR: 270 },
      availability: 'in-stock',
      badge: { type: 'new' },
    },
    translations: {
      pt: {
        name: 'Polish Body Scrub',
        description:
          'Esfoliante corporal revigorante que remove células mortas e suaviza a textura da pele.',
        highlights: ['Esfoliação Ativa', 'Pele Macia', 'Toque Sedoso'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Polish Body Scrub',
        description:
          'Gommage corporel revigorant qui élimine les cellules mortes et lisse le grain de peau.',
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
    featured: true,
    featuredOrder: 3,
    categoryId: 'cat-2',
    sizeIds: ['size-200ml'],
    images: [
      '/assets/images/products/product-3-1.webp',
      '/assets/images/products/product-3-2.webp',
      '/assets/images/products/product-3-3.webp',
      '/assets/images/products/product-3-4.webp',
    ],
    thumbnailImage: '/assets/images/products/thumbnails/product-3.webp',
    featuredImage: '/assets/images/products/featured/product-3.webp',
    commerce: {
      prices: { AOA: 270000, EUR: 270 },
      availability: 'coming-soon',
      badge: { type: 'coming-soon' },
    },
    translations: {
      pt: {
        name: 'Snow White Body Cream',
        description:
          'Creme corporal hidratante intenso que restaura a barreira lipídica natural.',
        highlights: [
          'Hidratação Corporal',
          'Absorção Rápida',
          'Toque Acetinado',
        ],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Snow White Body Cream',
        description:
          'Crème corporelle hydratante intense qui restaure la barrière lipidique naturelle.',
        highlights: [
          'Hydratation Corporelle',
          'Absorption Rapide',
          'Fini Satiné',
        ],
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
    featured: false,
    commerce: commerce(180000),
    homePlacements: [
      {
        type: 'editorial-gallery',
        order: 1,
        coverImage:
          '/assets/images/products/editorial/product-4/product-4-editorial-cover.webp',
        imageIndexes: [0, 1, 2, 3, 4],
      },
    ],
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: [
      '/assets/images/products/editorial/product-4/product-4-1.webp',
      '/assets/images/products/editorial/product-4/product-4-2.webp',
      '/assets/images/products/editorial/product-4/product-4-3.webp',
      '/assets/images/products/editorial/product-4/product-4-4.webp',
      '/assets/images/products/editorial/product-4/product-4-5.webp',
    ],
    thumbnailImage: '/assets/images/products/thumbnails/product-4.webp',
    translations: {
      pt: {
        name: 'Snow White Face Cream',
        galleryEditorial: {
          headline: 'Fluido de hidratação Snow White Face Cream',
          description:
            'Experimente a luminosidade e proteção que sua pele merece com o Snow White Face Cream, garantindo um acabamento natural e radiante.',
        },
        description:
          'Creme facial hidratante e iluminador profundo que devolve a luminosidade natural.',
        highlights: ['Luminosidade', 'Antioxidante', 'Uso Diário'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Snow White Face Cream',
        galleryEditorial: {
          headline: 'Fluide hydratant Snow White Face Cream',
          description:
            'Découvrez la luminosité et la protection que votre peau mérite avec Snow White Face Cream, pour un fini naturel et éclatant.',
        },
        description:
          'Crème visage hydratante et illuminatrice profonde qui redonne de l’éclat.',
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
    featured: false,
    commerce: commerce(165000),
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-5-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-5.webp',
    translations: {
      pt: {
        name: 'Pris Caramel Face Cream',
        description:
          'Creme facial firmador enriquecido com extrato de caramelo para vitalidade.',
        highlights: ['Firmeza', 'Nutrição Facial', 'Toque Aveludado'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Pris Caramel Face Cream',
        description:
          'Crème visage raffermissante enrichie en extrait de caramel pour la vitalité.',
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
    featured: false,
    commerce: {
      prices: { AOA: 150000, EUR: 150 },
      availability: 'in-stock',
    },
    homePlacements: [
      {
        type: 'editorial-cover',
        order: 1,
        mediaType: 'video',
        mediaUrl: '/assets/videos/products/caramel-body-cream-editorial.mp4',
        hasNoise: false,
      },
    ],
    categoryId: 'cat-2',
    sizeIds: ['size-200ml'],
    images: ['/assets/images/products/product-6-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-6.webp',
    translations: {
      pt: {
        name: 'Caramel Body Cream',
        editorial: {
          headline:
            'Creme Corporal Caramel: Hidratação e suavidade em cada aplicação.',
          description:
            'Transforme sua rotina com o Caramel Set. Este creme hidrata e traz frescor, garantindo uma pele saudável e luminosa. Experimente e sinta a diferença!',
          footnote:
            'O Caramel Body Cream é ideal para sua pele. Com ingredientes selecionados, oferece hidratação intensa, deixando-a suave e irresistível o dia todo.',
        },
        description:
          'Creme corporal reconfortante com fragrância doce e hidratação prolongada.',
        highlights: ['Hidratação 24h', 'Aroma Doce', 'Nutrição'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Caramel Body Cream',
        editorial: {
          headline:
            'Crème Corps Caramel : hydratation et douceur à chaque application.',
          description:
            'Transformez votre routine avec le Caramel Set. Cette crème hydrate et rafraîchit la peau pour la garder saine et lumineuse. Essayez-la et sentez la différence !',
          footnote:
            'Le Caramel Body Cream est idéal pour votre peau. Ses ingrédients sélectionnés procurent une hydratation intense et la laissent douce et irrésistible toute la journée.',
        },
        description:
          'Crème corporelle réconfortante au parfum sucré et hydratation prolongée.',
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
    featured: false,
    commerce: commerce(95000),
    categoryId: 'cat-1',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-7-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-7.webp',
    translations: {
      pt: {
        name: 'Flora Carrot Soap',
        description:
          'Sabonete vegetal de cenoura rico em beta-caroteno para vitalidade cutânea.',
        highlights: ['Sabonete Vegetal', 'Beta-Caroteno', 'Luminosidade'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Flora Carrot Soap',
        description:
          'Savon végétal à la carotte riche en bêta-carotène pour la vitalité cutanée.',
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
    featured: false,
    commerce: commerce(85000),
    categoryId: 'cat-1',
    sizeIds: ['size-100ml'],
    images: ['/assets/images/products/product-8-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-8.webp',
    translations: {
      pt: {
        name: 'Carrot Soap 150g',
        description:
          'Sabonete purificante de cenoura em barra para cuidado diário de peles baças.',
        highlights: ['Barra de Cenoura', 'Ação Purificante', 'Vitalidade'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Carrot Soap 150g',
        description:
          'Savon purifiant à la carotte en pain pour le soin quotidien des peaux ternes.',
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
    featured: false,
    commerce: commerce(65000),
    categoryId: 'cat-3',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-9-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-9.webp',
    translations: {
      pt: {
        name: 'Pink Lip Balm',
        description:
          'Bálsamo labial hidratante que confere um tom rosado natural e proteção contra o ressecamento.',
        highlights: ['Brilho Rosado', 'Hidratação de Lábios', 'Proteção'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Pink Lip Balm',
        description:
          'Baume à lèvres hydratant offrant un fini rosé naturel et une protection contre le dessèchement.',
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
    featured: false,
    commerce: commerce(175000),
    categoryId: 'cat-3',
    sizeIds: ['size-100ml'],
    images: ['/assets/images/products/product-10-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-10.webp',
    translations: {
      pt: {
        name: 'Aktive Clear Soluciona',
        description:
          'Tratamento direcionado para imperfeições faciais e regulação de oleosidade.',
        highlights: [
          'Controlo de Imperfeições',
          'Antioleosidade',
          'Ação Rápida',
        ],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Aktive Clear Soluciona',
        description:
          'Soin ciblé pour les imperfections du visage et régulation du sébum.',
        highlights: [
          'Contrôle des Imperfections',
          'Anti-Sébum',
          'Action Rapide',
        ],
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
    featured: false,
    commerce: commerce(120000),
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-11-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-11.webp',
    translations: {
      pt: {
        name: 'Aldnira Face Scrub',
        description:
          'Esfoliante facial suave para renovação celular e desobstrução de poros.',
        highlights: ['Esfoliação Facial', 'Renovação Celular', 'Poros Limpos'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Aldnira Face Scrub',
        description:
          'Gommage visage doux pour le renouvellement cellulaire et la purification des pores.',
        highlights: [
          'Gommage Visage',
          'Renouvellement Celulaire',
          'Pores Purifiés',
        ],
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
    featured: false,
    commerce: commerce(190000),
    categoryId: 'cat-3',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-12-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-12.webp',
    translations: {
      pt: {
        name: 'Dark Spot Removal',
        description:
          'Tratamento intensivo localizado para redução gradual de manchas escuras e hiperpigmentação.',
        highlights: [
          'Remoção de Manchas',
          'Tonalidade Equilibrada',
          'Intensivo',
        ],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Dark Spot Removal',
        description:
          'Soin ciblé intensif pour atténuer progressivement les taches brunes et l’hyperpigmentation.',
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
    featured: false,
    commerce: commerce(210000),
    categoryId: 'cat-2',
    sizeIds: ['size-50ml'],
    images: ['/assets/images/products/product-13-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-13.webp',
    translations: {
      pt: {
        name: 'Vitamin C Serum Anti-Aging',
        description:
          'Sérum de vitamina C ativa para luminosidade extrema e prevenção de linhas de expressão.',
        highlights: ['Vitamina C Ativa', 'Prevenção de Idade', 'Antioxidante'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Vitamin C Serum Anti-Aging',
        description:
          'Sérum à la vitamine C active pour un éclat extrême et prévention des ridules.',
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
    featured: false,
    commerce: commerce(220000),
    categoryId: 'cat-2',
    sizeIds: ['size-100ml'],
    images: ['/assets/images/products/product-14-1.webp'],
    thumbnailImage: '/assets/images/products/thumbnails/product-14.webp',
    translations: {
      pt: {
        name: 'Sunscreen SPF50 100g',
        description:
          'Protetor solar facial e corporal de amplo espetro contra raios UVA/UVB e envelhecimento precoce.',
        highlights: ['Proteção SPF50', 'Fórmula Leve', 'UVA/UVB'],
        benefits: DEFAULT_BENEFITS,
        ingredients: DEFAULT_INGREDIENTS,
        howToUse: DEFAULT_HOW_TO_USE,
        result: DEFAULT_RESULT,
        reviews: DEFAULT_REVIEWS,
      },
      fr: {
        name: 'Sunscreen SPF50 100g',
        description:
          'Protecteur solaire visage et corps à large spectre contre les UVA/UVB.',
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
