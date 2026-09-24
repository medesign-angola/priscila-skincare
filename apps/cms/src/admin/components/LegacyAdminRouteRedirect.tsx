import { Navigate, useLocation, useParams } from 'react-router-dom';

type CollectionRoute = {
  list: string;
  create?: string;
  detail: (documentId: string) => string;
};

const collectionRoutes: Record<string, CollectionRoute> = {
  'api::product.product': {
    list: '/store/products',
    create: '/store/products/new',
    detail: (documentId) => `/store/products/${documentId}/edit`,
  },
  'api::order.order': {
    list: '/store/orders',
    detail: (documentId) => `/store/orders/${documentId}`,
  },
  'api::review.review': {
    list: '/store/reviews',
    detail: (documentId) => `/store/reviews/${documentId}`,
  },
  'api::customer.customer': {
    list: '/store/customers',
    detail: (documentId) => `/store/customers/${documentId}`,
  },
  'api::kit.kit': {
    list: '/store/kits',
    create: '/store/kits/new',
    detail: (documentId) => `/store/kits/${documentId}/edit`,
  },
  'api::category.category': {
    list: '/store/categories',
    create: '/store/categories/new',
    detail: (documentId) => `/store/categories/${documentId}/edit`,
  },
  'api::collection.collection': {
    list: '/store/collections',
    create: '/store/collections/new',
    detail: (documentId) => `/store/collections/${documentId}/edit`,
  },
  'api::ingredient.ingredient': {
    list: '/store/ingredients',
    create: '/store/ingredients/new',
    detail: (documentId) => `/store/ingredients/${documentId}/edit`,
  },
  'api::size.size': {
    list: '/store/sizes',
    create: '/store/sizes/new',
    detail: (documentId) => `/store/sizes/${documentId}/edit`,
  },
  'api::hero-slide.hero-slide': {
    list: '/store/banners',
    create: '/store/banners/new',
    detail: (documentId) => `/store/banners/${documentId}/edit`,
  },
  'api::testimonial.testimonial': {
    list: '/store/testimonials',
    create: '/store/testimonials/new',
    detail: (documentId) => `/store/testimonials/${documentId}/edit`,
  },
};

const singleTypeRoutes: Record<string, string> = {
  'api::site-setting.site-setting': '/store/site-settings',
  'api::home-page.home-page': '/store/home-page',
  'api::about-page.about-page': '/store/about-page',
};

function preserveSearch(search: string) {
  const params = new URLSearchParams(search);
  const legacyLocale = params.get('plugins[i18n][locale]');
  if (legacyLocale && !params.has('locale')) params.set('locale', legacyLocale);
  params.delete('plugins[i18n][locale]');
  const value = params.toString();
  return value ? `?${value}` : '';
}

function Redirect({ pathname }: { pathname: string }) {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={{ pathname, search: preserveSearch(location.search) }}
    />
  );
}

function collectionRoute(uid: string | undefined) {
  return uid ? collectionRoutes[uid] : undefined;
}

export function LegacyContentManagerRedirect() {
  return <Redirect pathname="/store/products" />;
}

export function LegacyCollectionListRedirect() {
  const route = collectionRoute(useParams().uid);
  return <Redirect pathname={route?.list ?? '/'} />;
}

export function LegacyCollectionCreateRedirect() {
  const route = collectionRoute(useParams().uid);
  return <Redirect pathname={route?.create ?? route?.list ?? '/'} />;
}

export function LegacyCollectionDetailRedirect() {
  const { uid, documentId } = useParams();
  const route = collectionRoute(uid);
  return (
    <Redirect
      pathname={
        route && documentId ? route.detail(documentId) : (route?.list ?? '/')
      }
    />
  );
}

export function LegacySingleTypeRedirect() {
  const { uid } = useParams();
  return <Redirect pathname={(uid && singleTypeRoutes[uid]) || '/'} />;
}

export function LegacyUsersRedirect() {
  return <Redirect pathname="/store/users" />;
}

export function LegacyUserCreateRedirect() {
  return <Redirect pathname="/store/users/new" />;
}

export function LegacyUserDetailRedirect() {
  const { documentId } = useParams();
  return <Redirect pathname={documentId ? `/store/users/${documentId}` : '/store/users'} />;
}

export function LegacyProfileRedirect() {
  return <Redirect pathname="/store/profile" />;
}
