import { Category } from '../models/category.interface';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Serum',
    slug: 'serum',
    translations: { pt: 'Sérum', fr: 'Sérum' },
  },
  {
    id: 'cat-2',
    name: 'Moisturizers',
    slug: 'moisturizers',
    translations: { pt: 'Hidratante', fr: 'Hydratant' },
  },
  {
    id: 'cat-3',
    name: 'Treatment Oils',
    slug: 'treatment-oils',
    translations: { pt: 'Óleo de tratamento', fr: 'Huile de soin' },
  },
];
