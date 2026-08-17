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

    const orderFields = [
      {
        name: 'order-address',
        label: 'Morada de entrega',
        exportName: 'OrderAddressInput',
      },
      {
        name: 'order-items',
        label: 'Produtos da encomenda',
        exportName: 'OrderItemsInput',
      },
      {
        name: 'order-timeline',
        label: 'Histórico de estados',
        exportName: 'OrderTimelineInput',
      },
    ] as const;

    for (const field of orderFields) {
      app.customFields.register({
        name: field.name,
        type: 'json',
        intlLabel: {
          id: `priscila.fields.${field.name}.label`,
          defaultMessage: field.label,
        },
        intlDescription: {
          id: `priscila.fields.${field.name}.description`,
          defaultMessage: 'Informação gerada automaticamente pela loja.',
        },
        components: {
          Input: async () =>
            import('./components/OrderReadOnlyInput').then((module) => ({
              default: module[field.exportName],
            })),
        },
      });
    }
  },
};
