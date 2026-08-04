import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: ['pt', 'fr'],
    translations: {
      pt: {
        'app.components.LeftMenu.navbrand.title': 'Priscila Skincare',
        'app.components.LeftMenu.navbrand.workplace': 'Gestão de conteúdos',
      },
      fr: {
        'app.components.LeftMenu.navbrand.title': 'Priscila Skincare',
        'app.components.LeftMenu.navbrand.workplace': 'Gestion de contenu',
      },
    },
  },
  register(app: StrapiApp) {
    app.customFields.register({
      name: 'friendly-select',
      type: 'string',
      intlLabel: {
        id: 'priscila.fields.friendly-select.label',
        defaultMessage: 'Escolha orientada',
      },
      intlDescription: {
        id: 'priscila.fields.friendly-select.description',
        defaultMessage: 'Escolha uma opção com uma explicação clara.',
      },
      components: {
        Input: async () =>
          import('./components/FriendlySelectInput').then((module) => ({
            default: module.FriendlySelectInput,
          })),
      },
    });
  },
};
