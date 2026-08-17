import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'checkout',
    renderMode: RenderMode.Client,
  },
  {
    path: 'conta/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'produtos/colecao/:contextId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'produtos/categoria/:contextId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'produtos/kit/:contextId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'kits/:bundleId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'colecoes/:bundleId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'avaliar',
    renderMode: RenderMode.Client,
  },
  {
    path: 'avaliacao-enviada',
    renderMode: RenderMode.Client,
  },
  {
    path: 'produtos/:productId/avaliar',
    renderMode: RenderMode.Client,
  },
  {
    path: 'produtos/:productId/avaliacao-enviada',
    renderMode: RenderMode.Client,
  },
  {
    path: 'produtos/:productId',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
