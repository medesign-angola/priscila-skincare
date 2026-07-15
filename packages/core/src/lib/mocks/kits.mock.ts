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
  },
];
