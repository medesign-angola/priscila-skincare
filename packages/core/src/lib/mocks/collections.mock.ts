import { Collection } from '../models/collection.interface';

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: 'Caramel Collection',
    slug: 'caramel-collection',
    description:
      'Complete line of skincare products powered by organic caramel and peptide actives.',
    productIds: ['prod-1', 'prod-2'],
  },
];
