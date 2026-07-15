import { Kit } from '../models/kit.interface';

export const MOCK_KITS: Kit[] = [
  {
    id: 'kit-1',
    name: 'Snow White',
    collection: 'Caramel Set',
    description: 'O brilho que a sua pele merece todos os dias',
    price: 270000,
    currency: 'Kz',
    mediaType: 'image',
    mediaUrl: '/assets/images/home-hero.png',
    mediaStyle: 'split-right',
    placeholderUrl: '/assets/images/home-hero-placeholder.png',
    productIds: ['prod-1', 'prod-2'], // Snow White Cream + Caramel Serum
    featured: true,
    home: {
      order: 1,
      thumbnailImage: '/assets/images/kits/caramel-set.webp',
      mediaType: 'image',
      mediaUrl: '/assets/images/kits/hydration-editorial.webp',
      mediaStyle: 'split-right',
      placeholderUrl:
        '/assets/images/kits/hydration-editorial-placeholder.webp',
      translations: {
        pt: {
          editorialTitle: 'O fluido de hidratação SPF30',
          editorialDescription:
            'Unifique a pele para um último segundo de pele natural e luminosa, reforçando os mecanismos de proteção da pele.',
          finderDescription:
            'Caramel Set: hidratação e suavidade para o seu dia.',
        },
        fr: {
          editorialTitle: 'Le fluide hydratant SPF30',
          editorialDescription:
            'Unifiez la peau pour un fini naturel et lumineux, tout en renforçant ses mécanismes de protection.',
          finderDescription:
            'Caramel Set : hydratation et douceur au quotidien.',
        },
      },
    },
  },
  {
    id: 'kit-2',
    name: 'Golden Radiance',
    collection: 'Luxury Elixir',
    description: 'Nutrição para pele luminosa e uniforme',
    price: 350000,
    currency: 'Kz',
    mediaType: 'video',
    mediaUrl: '/assets/videos/home-hero.mp4',
    mediaStyle: 'cover',
    placeholderUrl: '/assets/images/video-placeholder.jpg',
    productIds: ['prod-3'], // Golden Radiance Oil
    featured: true,
    home: {
      order: 2,
      thumbnailImage: '/assets/images/kits/radiance-routine.webp',
      mediaType: 'image',
      mediaUrl: '/assets/images/kits/radiance-routine.webp',
      mediaStyle: 'cover',
      translations: {
        pt: {
          editorialTitle: 'Luminosidade que se sente',
          editorialDescription:
            'Uma rotina concentrada para nutrir e uniformizar a pele.',
          finderDescription:
            'Descubra a linha de produtos que transformam a sua beleza.',
        },
        fr: {
          editorialTitle: 'Un éclat qui se ressent',
          editorialDescription:
            'Une routine concentrée pour nourrir et unifier la peau.',
          finderDescription:
            'Découvrez la gamme de produits qui transforme votre beauté.',
        },
      },
    },
  },
  {
    id: 'kit-3',
    name: 'Hydra Basic',
    collection: 'Daily Skincare',
    description: 'A rotina de hidratação diária essencial para a sua pele',
    price: 120000,
    currency: 'Kz',
    mediaType: 'image',
    mediaUrl: '/assets/images/home-hero.png',
    mediaStyle: 'split-right',
    placeholderUrl: '/assets/images/home-hero-placeholder.png',
    productIds: ['prod-1'],
    featured: false, // hidden on homepage banner slider
    home: {
      order: 3,
      thumbnailImage: '/assets/images/kits/clear-skin-routine.webp',
      mediaType: 'image',
      mediaUrl: '/assets/images/kits/clear-skin-routine.webp',
      mediaStyle: 'cover',
      translations: {
        pt: {
          editorialTitle: 'O essencial para a sua pele',
          editorialDescription:
            'Uma seleção diária simples, eficaz e adequada às suas necessidades.',
          finderDescription:
            'Encontre o produto ideal para cuidar da sua pele.',
        },
        fr: {
          editorialTitle: "L'essentiel pour votre peau",
          editorialDescription:
            'Une sélection quotidienne simple, efficace et adaptée à vos besoins.',
          finderDescription:
            'Trouvez le produit idéal pour prendre soin de votre peau.',
        },
      },
    },
  },
  {
    id: 'kit-4',
    name: 'Aloe Balance',
    collection: 'Active Care',
    description: 'Cuidado calmante para uma pele equilibrada e confortável',
    price: 185000,
    currency: 'Kz',
    mediaType: 'image',
    mediaUrl: '/assets/images/kits/aloe-routine.webp',
    mediaStyle: 'cover',
    productIds: ['prod-4', 'prod-5'],
    featured: false,
    home: {
      order: 4,
      thumbnailImage: '/assets/images/kits/aloe-routine.webp',
      mediaType: 'image',
      mediaUrl: '/assets/images/kits/aloe-routine.webp',
      mediaStyle: 'cover',
      translations: {
        pt: {
          editorialTitle: 'Equilíbrio e conforto',
          editorialDescription:
            'Ativos suaves para acalmar e apoiar a barreira natural da pele.',
          finderDescription:
            'Descubra produtos que atendem às suas necessidades.',
        },
        fr: {
          editorialTitle: 'Équilibre et confort',
          editorialDescription:
            'Des actifs doux pour apaiser et soutenir la barrière naturelle de la peau.',
          finderDescription: 'Découvrez des produits adaptés à vos besoins.',
        },
      },
    },
  },
];
