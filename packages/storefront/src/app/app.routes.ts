import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'produtos/:productId',
    loadComponent: () =>
      import('./pages/product-details/product-details').then(
        (m) => m.ProductDetails,
      ),
  },
];
