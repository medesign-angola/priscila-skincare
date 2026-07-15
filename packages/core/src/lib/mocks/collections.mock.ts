import { Collection } from '../models/collection.interface';

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: 'Snow White Set Big',
    slug: 'snow-white-set-big',
    description:
      'Complete Snow White ritual for cleansing, hydrating, and caring for the face and body.',
    thumbnailImage:
      '/assets/images/collections/thumbnails/snow-white-set-big.webp',
    productIds: ['prod-1', 'prod-3', 'prod-4'],
  },
  {
    id: 'col-2',
    name: 'Snow White Set Mini',
    slug: 'snow-white-set-mini',
    description:
      'Essential Snow White face care in a compact set for a simple daily ritual.',
    thumbnailImage:
      '/assets/images/collections/thumbnails/snow-white-set-mini.webp',
    productIds: ['prod-1', 'prod-4'],
  },
  {
    id: 'col-3',
    name: 'Caramel Set',
    slug: 'caramel-set',
    description:
      'Complete caramel care set created to nourish and hydrate the face and body.',
    thumbnailImage: '/assets/images/collections/thumbnails/caramel-set.webp',
    productIds: ['prod-5', 'prod-6'],
  },
  {
    id: 'col-4',
    name: 'Caramel Set Mini',
    slug: 'caramel-set-mini',
    description:
      'Compact caramel care set with the essentials for hydrated face and body skin.',
    thumbnailImage:
      '/assets/images/collections/thumbnails/caramel-set-mini.webp',
    productIds: ['prod-5', 'prod-6'],
  },
];
