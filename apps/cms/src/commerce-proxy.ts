import type { Core } from '@strapi/strapi';

const centralWarehouseId = '334a7da4-f292-48dc-a346-8ff03170fd0d';

async function importMissingCentralStock(strapi: Core.Strapi, base: string, secret: string) {
  const products = new Map<string, { sku: string; stock: number | null }>();
  // Published quantities take precedence over unpublished edits. Draft-only
  // products are included too. One locale prevents importing translations twice.
  for (const status of ['draft', 'published'] as const) {
    for (let start = 0; ; start += 100) {
      const page = await strapi.documents('api::product.product').findMany({
        locale: 'pt', status, fields: ['sku'], populate: { commerce: { fields: ['stock'] } },
        sort: 'id:asc', start, limit: 100,
      });
      for (const product of page) {
        if (product.sku) products.set(product.sku, { sku: product.sku, stock: product.commerce?.stock ?? null });
      }
      if (page.length < 100) break;
    }
  }
  const values = [...products.values()];
  for (let start = 0; start < values.length; start += 100) {
    const response = await fetch(`${base}/api/v1/integrations/strapi/locations/central-stock/import`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Integration-Secret': secret },
      body: JSON.stringify({ products: values.slice(start, start + 100) }), signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error('Não foi possível importar o stock inicial.');
  }
}

export async function registerCommercePermissions(strapi: Core.Strapi) {
  await strapi.admin.services.permission.actionProvider.registerMany([
    { uid: 'commerce.read', displayName: 'Consultar operações comerciais', pluginName: 'admin', section: 'settings', category: 'commerce' },
    { uid: 'commerce.update', displayName: 'Gerir operações comerciais', pluginName: 'admin', section: 'settings', category: 'commerce' },
  ]);
}

export function registerCommerceProxy(strapi: Core.Strapi) {
  strapi.server.routes({
    type: 'admin', prefix: '/admin/commerce',
    routes: (['GET', 'POST', 'PUT'] as const).flatMap(method => (method === 'PUT' ? ['/locations/:id'] : ['/locations', '/locations/:id/stock', '/locations/:id/transfers', '/delivery-rates', '/promotions']).map(path => ({
      method, path,
      info: { type: 'admin' },
      config: { policies: ['admin::isAuthenticatedAdmin', {
        name: 'admin::hasPermissions', config: { actions: [method === 'GET' ? 'admin::commerce.read' : 'admin::commerce.update'] },
      }] },
      handler: async ctx => {
        const base = process.env.APPLICATION_API_URL?.replace(/\/$/, '');
        const secret = process.env.REVIEW_INTEGRATION_SECRET;
        if (!base || !secret) return ctx.serviceUnavailable('A gestão comercial não está disponível.');
        const id = ctx.params.id ? String(ctx.params.id) : '';
        if (id && !/^[a-f0-9-]{36}$/i.test(id)) return ctx.badRequest('Localização inválida.');
        try {
          if (method === 'GET' && path === '/locations/:id/stock' && id === centralWarehouseId) {
            await importMissingCentralStock(strapi, base, secret);
          }
          const target = path.replace('/:id', id ? `/${id}` : '');
          const response = await fetch(`${base}/api/v1/integrations/strapi${target}`, {
            method, headers: { 'Content-Type': 'application/json', 'X-Integration-Secret': secret },
            body: method === 'GET' ? undefined : JSON.stringify(ctx.request.body ?? {}),
            signal: AbortSignal.timeout(15_000),
          });
          const data = await response.json().catch(() => ({})) as { title?: string; code?: string };
          ctx.status = response.status;
          ctx.body = response.ok ? data : { error: { message: data.title ?? 'Não foi possível guardar a localização.', code: data.code } };
        } catch {
          ctx.status = 503;
          ctx.body = { error: { message: 'Não foi possível contactar a gestão comercial. Tente novamente.' } };
        }
      },
    }))),
  });
}
