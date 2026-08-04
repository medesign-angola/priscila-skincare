import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
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
