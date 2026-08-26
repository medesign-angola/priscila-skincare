import type { StrapiApp } from '@strapi/strapi/admin';
import { Layout, Star, Store } from '@strapi/icons';
import { priscilaDarkTheme, priscilaLightTheme } from './admin-theme';
import './styles/admin.css';

export default {
  config: {
    auth: { logo: '/admin/priscila-logo.svg' },
    menu: { logo: '/admin/priscila-logo.svg' },
    locales: ['pt', 'fr'],
    notifications: { releases: false },
    tutorials: false,
    theme: {
      light: priscilaLightTheme,
      dark: priscilaDarkTheme,
    },
    translations: {
      pt: {
        'HomePage.head.title': 'Início',
        'Content Manager': 'Conteúdos da loja',
        'global.content-manager': 'Conteúdos da loja',
        'global.plugins.content-manager': 'Conteúdos da loja',
        'Content Type Builder': 'Estrutura técnica',
        'global.plugins.content-type-builder': 'Estrutura técnica',
        'app.components.LeftMenu.navbrand.title': 'Priscila Skincare',
        'app.components.LeftMenu.navbrand.workplace': 'Gestão da loja',
        'Auth.form.welcome.title': 'Bem-vindo ao painel Priscila Skincare',
        'Auth.form.welcome.subtitle': 'Entre para gerir a loja, os conteúdos e as encomendas.',
      },
      fr: {
        'HomePage.head.title': 'Accueil',
        'Content Manager': 'Contenus de la boutique',
        'global.content-manager': 'Contenus de la boutique',
        'global.plugins.content-manager': 'Contenus de la boutique',
        'Content Type Builder': 'Structure technique',
        'global.plugins.content-type-builder': 'Structure technique',
        'app.components.LeftMenu.navbrand.title': 'Priscila Skincare',
        'app.components.LeftMenu.navbrand.workplace': 'Gestion de la boutique',
      },
    },
  },
  register(app: StrapiApp) {
    app.router.addRoute((routes) =>
      routes.map((route) =>
        route.index
          ? {
              ...route,
              lazy: async () => ({
                Component: (await import('./pages/StoreDashboardPage')).default,
              }),
            }
          : route,
      ),
    );

    app.widgets.register([
      {
        id: 'store-overview',
        title: { id: 'priscila.widgets.overview.title', defaultMessage: 'Visão geral da loja' },
        icon: Store,
        component: async () => (await import('./components/StoreOverviewWidget')).default,
      },
      {
        id: 'quick-actions',
        title: { id: 'priscila.widgets.actions.title', defaultMessage: 'Ações rápidas' },
        icon: Layout,
        component: async () => (await import('./components/QuickActionsWidget')).default,
      },
      {
        id: 'content-guide',
        title: { id: 'priscila.widgets.guide.title', defaultMessage: 'Antes de publicar' },
        icon: Star,
        component: async () => (await import('./components/ContentGuideWidget')).default,
      },
    ]);

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
