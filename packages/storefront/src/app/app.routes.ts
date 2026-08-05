import { Route } from '@angular/router';
import { authGuard } from './pages/auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'entrar',
    loadComponent: () => import('./pages/auth/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: 'verificar-codigo',
    loadComponent: () => import('./pages/auth/otp/otp').then((m) => m.Otp),
  },
  {
    path: 'conta',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/account-layout/account-layout').then((m) => m.AccountLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'encomendas' },
      { path: 'perfil', loadComponent: () => import('./pages/account/profile/profile').then((m) => m.Profile) },
      { path: 'encomendas', loadComponent: () => import('./pages/account/orders/orders').then((m) => m.Orders) },
      { path: 'encomendas/:orderId', loadComponent: () => import('./pages/account/order-details/order-details').then((m) => m.OrderDetails) },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'sobre',
    loadComponent: () =>
      import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'produtos',
    loadComponent: () =>
      import('./pages/products/products').then((m) => m.Products),
    data: { catalogContext: 'all' },
  },
  {
    path: 'produtos/colecao/:contextId',
    loadComponent: () =>
      import('./pages/products/products').then((m) => m.Products),
    data: { catalogContext: 'collection' },
  },
  {
    path: 'produtos/categoria/:contextId',
    loadComponent: () =>
      import('./pages/products/products').then((m) => m.Products),
    data: { catalogContext: 'category' },
  },
  {
    path: 'produtos/kit/:contextId',
    loadComponent: () =>
      import('./pages/products/products').then((m) => m.Products),
    data: { catalogContext: 'kit' },
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'produtos/:productId/avaliar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/product-review/product-review').then(
        (m) => m.ProductReview,
      ),
  },
  {
    path: 'produtos/:productId/avaliacao-enviada',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/product-review-success/product-review-success').then(
        (m) => m.ProductReviewSuccess,
      ),
  },
  {
    path: 'produtos/:productId',
    loadComponent: () =>
      import('./pages/product-details/product-details').then(
        (m) => m.ProductDetails,
      ),
  },
];
