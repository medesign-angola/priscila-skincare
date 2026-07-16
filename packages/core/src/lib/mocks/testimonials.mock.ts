import { HomeTestimonialsPresentation } from '../models/testimonial.interface';

export const MOCK_HOME_TESTIMONIALS: HomeTestimonialsPresentation = {
  translations: {
    pt: {
      title: 'O que nossos clientes dizem sobre os nossos produtos',
      description:
        'Baseado em ciência real para a vida real, nossos produtos são projetados para facilitar o cotidiano. Descubra como nossa comunidade os utiliza em diversas situações, desde a rotina matinal até momentos de lazer, e veja como eles podem transformar sua pele.',
    },
    fr: {
      title: 'Ce que nos clients disent de nos produits',
      description:
        'Fondés sur une science réelle pour la vie quotidienne, nos produits sont conçus pour simplifier chaque routine. Découvrez comment notre communauté les utilise, du rituel du matin aux moments de détente, et comment ils peuvent transformer votre peau.',
    },
  },
  testimonials: [
    {
      id: 'testimonial-marroly-makiese',
      authorLabel: '@marrolymakiese',
      videoUrl: '/assets/videos/testimonials/marroly-makiese.mp4',
      order: 1,
    },
    {
      id: 'testimonial-delma-silva',
      authorLabel: '@delmasilva',
      videoUrl: '/assets/videos/testimonials/delma-silva.mp4',
      order: 2,
    },
    {
      id: 'testimonial-jessica-pitbull-01',
      authorLabel: '@jessicapitbull',
      videoUrl: '/assets/videos/testimonials/jessica-pitbull-01.mp4',
      order: 3,
    },
    {
      id: 'testimonial-jessica-pitbull-02',
      authorLabel: '@jessicapitbull',
      videoUrl: '/assets/videos/testimonials/jessica-pitbull-02.mp4',
      order: 4,
    },
    {
      id: 'testimonial-priscila-01',
      authorLabel: 'Priscila Skincare',
      videoUrl: '/assets/videos/testimonials/priscila-01.mp4',
      order: 5,
    },
  ],
};
