import type { StrapiApp } from '@strapi/strapi/admin';
import { Layout, Star, Store } from '@strapi/icons';
import { priscilaDarkTheme, priscilaLightTheme } from './admin-theme';
import './styles/admin.css';

const redirectRegistrationToLogin = () => {
  if (typeof window === 'undefined') return;
  const registrationRoute = /\/auth\/register(?:-admin)?\/?$/;
  if (!registrationRoute.test(window.location.pathname)) return;
  const loginPath = window.location.pathname.replace(
    registrationRoute,
    '/auth/login',
  );
  window.location.replace(loginPath);
};

redirectRegistrationToLogin();

export default {
  config: {
    auth: { logo: '/admin/admin/login/logo.svg' },
    menu: { logo: '/priscila-logo.svg' },
    locales: ['pt', 'fr'],
    notifications: { releases: false },
    tutorials: false,
    theme: {
      light: priscilaLightTheme,
      dark: priscilaDarkTheme,
    },
    translations: {
      pt: {
        'content-manager.plugin.name': 'Conteúdos da loja',
        'HomePage.head.title': 'Início',
        'Content Manager': 'Conteúdos da loja',
        'global.content-manager': 'Conteúdos da loja',
        'global.plugins.content-manager': 'Conteúdos da loja',
        'Content Type Builder': 'Estrutura técnica',
        'global.plugins.content-type-builder': 'Estrutura técnica',
        'app.components.LeftMenu.navbrand.title': 'Priscila Skincare',
        'app.components.LeftMenu.navbrand.workplace': 'Gestão da loja',
        'Auth.form.welcome.title': 'Bem-vindo (a)',
        'Auth.form.welcome.subtitle':
          'Entre para gerir a loja, os conteúdos e as encomendas da Priscila Skincare.',
        'Auth.form.email.label': 'Email',
        'Auth.form.email.placeholder': 'ex.: nome@empresa.com',
        'Auth.form.rememberMe.label': 'Lembrar-me',
        'Auth.form.button.login': 'Entrar',
        'Auth.link.forgot-password': 'Esqueceu-se da palavra-passe?',
        'global.password': 'Palavra-passe',
        'content-manager.containers.edit.tabs.published': 'Publicado',
        'content-manager.containers.edit.tabs.draft': 'Rascunho',
        'content-manager.containers.List.published': 'Publicado',
        'content-manager.containers.List.draft': 'Rascunho',
        'content-manager.containers.List.modified': 'Modificado',
        'content-manager.containers.List.statusFilter.draft':
          'Rascunhos ainda não publicados',
        'content-manager.containers.List.statusFilter.published':
          'Todos os conteúdos publicados',
        'content-manager.containers.List.statusFilter.publishedModified':
          'Publicados com alterações',
        'content-manager.containers.List.statusFilter.publishedUnmodified':
          'Publicados sem alterações',
      },
      fr: {
        'content-manager.plugin.name': 'Contenus de la boutique',
        'HomePage.head.title': 'Accueil',
        'Content Manager': 'Contenus de la boutique',
        'global.content-manager': 'Contenus de la boutique',
        'global.plugins.content-manager': 'Contenus de la boutique',
        'Content Type Builder': 'Structure technique',
        'global.plugins.content-type-builder': 'Structure technique',
        'app.components.LeftMenu.navbrand.title': 'Priscila Skincare',
        'app.components.LeftMenu.navbrand.workplace': 'Gestion de la boutique',
        'content-manager.containers.edit.tabs.published': 'Publié',
        'content-manager.containers.edit.tabs.draft': 'Brouillon',
        'content-manager.containers.List.published': 'Publié',
        'content-manager.containers.List.draft': 'Brouillon',
        'content-manager.containers.List.modified': 'Modifié',
        'content-manager.containers.List.statusFilter.draft':
          'Brouillons jamais publiés',
        'content-manager.containers.List.statusFilter.published':
          'Tous les contenus publiés',
        'content-manager.containers.List.statusFilter.publishedModified':
          'Publiés avec modifications',
        'content-manager.containers.List.statusFilter.publishedUnmodified':
          'Publiés sans modifications',
      },
    },
  },
  register(app: StrapiApp) {
    app.router.addRoute((routes) => [
      ...routes.map((route) =>
        route.index
          ? {
              ...route,
              lazy: async () => ({
                Component: (await import('./pages/StoreDashboardPage')).default,
              }),
            }
          : route,
      ),
      {
        path: 'store/products',
        lazy: async () => ({
          Component: (await import('./pages/ProductListPage')).default,
        }),
      },
      {
        path: 'store/products/new',
        lazy: async () => ({
          Component: (await import('./pages/ProductCreatePage')).default,
        }),
      },
      {
        path: 'store/products/:documentId/edit',
        lazy: async () => ({
          Component: (await import('./pages/ProductCreatePage')).default,
        }),
      },
      {
        path: 'store/site-settings',
        lazy: async () => ({
          Component: (await import('./pages/SingleTypeEditorPage'))
            .SiteSettingsPage,
        }),
      },
      {
        path: 'store/home-page',
        lazy: async () => ({
          Component: (await import('./pages/SingleTypeEditorPage'))
            .HomePageEditor,
        }),
      },
      {
        path: 'store/about-page',
        lazy: async () => ({
          Component: (await import('./pages/SingleTypeEditorPage'))
            .AboutPageEditor,
        }),
      },
      {
        path: 'store/banners/new',
        lazy: async () => ({
          Component: (await import('./pages/HeroSlideFormPage')).default,
        }),
      },
      {
        path: 'store/banners/:documentId/edit',
        lazy: async () => ({
          Component: (await import('./pages/HeroSlideFormPage')).default,
        }),
      },
      {
        path: 'store/orders/:documentId',
        lazy: async () => ({
          Component: (await import('./pages/OrderDetailPage')).default,
        }),
      },
      {
        path: 'store/reviews/:documentId',
        lazy: async () => ({
          Component: (await import('./pages/StoreEntityDetailPage'))
            .ReviewDetailPage,
        }),
      },
      {
        path: 'store/customers/:documentId',
        lazy: async () => ({
          Component: (await import('./pages/StoreEntityDetailPage'))
            .CustomerDetailPage,
        }),
      },
      {
        path: 'store/users/:documentId',
        lazy: async () => ({
          Component: (await import('./pages/StoreEntityDetailPage'))
            .UserDetailPage,
        }),
      },
      {
        path: 'store/users/new',
        lazy: async () => ({
          Component: (await import('./pages/AdminUserFormPage'))
            .AdminUserCreatePage,
        }),
      },
      {
        path: 'store/users/:documentId/edit',
        lazy: async () => ({
          Component: (await import('./pages/AdminUserFormPage'))
            .AdminUserEditPage,
        }),
      },
      {
        path: 'store/profile',
        lazy: async () => ({
          Component: (await import('./pages/AdminUserFormPage')).ProfilePage,
        }),
      },
      ...[
        ['content-manager', 'LegacyContentManagerRedirect'],
        [
          'content-manager/collection-types/:uid/create',
          'LegacyCollectionCreateRedirect',
        ],
        [
          'content-manager/collection-types/:uid/:documentId',
          'LegacyCollectionDetailRedirect',
        ],
        [
          'content-manager/collection-types/:uid',
          'LegacyCollectionListRedirect',
        ],
        [
          'content-manager/single-types/:uid',
          'LegacySingleTypeRedirect',
        ],
        ['settings/users/create', 'LegacyUserCreateRedirect'],
        ['settings/users/:documentId', 'LegacyUserDetailRedirect'],
        ['settings/users', 'LegacyUsersRedirect'],
        ['settings/profile', 'LegacyProfileRedirect'],
      ].map(([path, component]) => ({
        path,
        lazy: async () => {
          const redirects = await import(
            './components/LegacyAdminRouteRedirect'
          );
          return {
            Component:
              redirects[component as keyof typeof redirects],
          };
        },
      })),
      {
        path: 'store/testimonials/new',
        lazy: async () => ({
          Component: (await import('./pages/TestimonialFormPage')).default,
        }),
      },
      {
        path: 'store/testimonials/:documentId/edit',
        lazy: async () => ({
          Component: (await import('./pages/TestimonialFormPage')).default,
        }),
      },
      {
        path: 'store/categories/new',
        lazy: async () => ({
          Component: (await import('./pages/CatalogEntryFormPage'))
            .CategoryFormPage,
        }),
      },
      {
        path: 'store/categories/:documentId/edit',
        lazy: async () => ({
          Component: (await import('./pages/CatalogEntryFormPage'))
            .CategoryFormPage,
        }),
      },
      {
        path: 'store/sizes/new',
        lazy: async () => ({
          Component: (await import('./pages/CatalogEntryFormPage'))
            .SizeFormPage,
        }),
      },
      {
        path: 'store/sizes/:documentId/edit',
        lazy: async () => ({
          Component: (await import('./pages/CatalogEntryFormPage'))
            .SizeFormPage,
        }),
      },
      ...[
        ['kits', 'KitFormPage'],
        ['collections', 'CollectionFormPage'],
        ['ingredients', 'IngredientFormPage'],
      ].flatMap(([resource, component]) => [
        {
          path: `store/${resource}/new`,
          lazy: async () => {
            const pages = await import('./pages/RichCatalogFormPage');
            return { Component: pages[component as keyof typeof pages] };
          },
        },
        {
          path: `store/${resource}/:documentId/edit`,
          lazy: async () => {
            const pages = await import('./pages/RichCatalogFormPage');
            return { Component: pages[component as keyof typeof pages] };
          },
        },
      ]),
      ...[
        ['orders', 'OrdersListPage'],
        ['reviews', 'ReviewsListPage'],
        ['customers', 'CustomersListPage'],
        ['kits', 'KitsListPage'],
        ['categories', 'CategoriesListPage'],
        ['collections', 'CollectionsListPage'],
        ['ingredients', 'IngredientsListPage'],
        ['sizes', 'SizesListPage'],
        ['banners', 'BannersListPage'],
        ['users', 'UsersListPage'],
        ['testimonials', 'TestimonialsListPage'],
      ].map(([path, component]) => ({
        path: `store/${path}`,
        lazy: async () => {
          const pages = await import('./pages/StoreCollectionListPage');
          return { Component: pages[component as keyof typeof pages] };
        },
      })),
    ]);

    app.widgets.register([
      {
        id: 'store-overview',
        title: {
          id: 'priscila.widgets.overview.title',
          defaultMessage: 'Visão geral da loja',
        },
        icon: Store,
        component: async () =>
          (await import('./components/StoreOverviewWidget')).default,
      },
      {
        id: 'quick-actions',
        title: {
          id: 'priscila.widgets.actions.title',
          defaultMessage: 'Ações rápidas',
        },
        icon: Layout,
        component: async () =>
          (await import('./components/QuickActionsWidget')).default,
      },
      {
        id: 'content-guide',
        title: {
          id: 'priscila.widgets.guide.title',
          defaultMessage: 'Antes de publicar',
        },
        icon: Star,
        component: async () =>
          (await import('./components/ContentGuideWidget')).default,
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
  bootstrap() {
    const identifyNativeLogin = () => {
      redirectRegistrationToLogin();
      const form = document.querySelector('form');
      const email = form?.querySelector("input[name='email']");
      const password = form?.querySelector("input[name='password']");
      const rememberMe = form?.querySelector<HTMLInputElement>(
        "input[type='checkbox'][aria-hidden='true']",
      );

      if (email && password && rememberMe) {
        rememberMe.name = 'rememberMe';
      }
    };

    const observer = new MutationObserver(identifyNativeLogin);
    observer.observe(document.body, { childList: true, subtree: true });
    identifyNativeLogin();
  },
};
