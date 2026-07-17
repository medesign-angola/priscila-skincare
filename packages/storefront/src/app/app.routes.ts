import { Route } from '@angular/router';

export const appRoutes: Route[] = [
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
    path: 'produtos/:productId',
    loadComponent: () =>
      import('./pages/product-details/product-details').then(
        (m) => m.ProductDetails,
      ),
  },
];
