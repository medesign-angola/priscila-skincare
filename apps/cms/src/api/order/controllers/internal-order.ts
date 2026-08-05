import type { Core } from '@strapi/strapi';

type Payload = Record<string, unknown> & { externalOrderId: string; number: string; externalCustomerId: string; customerEmail: string };
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sync(ctx: { request: { headers: Record<string, string | undefined>; body: Payload }; unauthorized: () => void; badRequest: (message: string) => void; body?: unknown }) {
    const expected = process.env.REVIEW_INTEGRATION_SECRET;
    if (!expected || ctx.request.headers['x-integration-secret'] !== expected) return ctx.unauthorized();
    const payload = ctx.request.body;
    if (!payload?.externalOrderId || !payload.number || !payload.externalCustomerId) return ctx.badRequest('Encomenda inválida.');
    const customers = await strapi.documents('api::customer.customer').findMany({ filters: { externalCustomerId: { $eq: payload.externalCustomerId } } as never, limit: 1 });
    if (!customers[0]) return ctx.badRequest('Cliente da encomenda não encontrado.');
    const orderDocuments = strapi.documents('api::order.order' as never) as unknown as {
      findMany(args: unknown): Promise<Array<{ documentId: string }>>;
      update(args: unknown): Promise<{ documentId: string } | null>;
      create(args: unknown): Promise<{ documentId: string } | null>;
    };
    const existing = await orderDocuments.findMany({ filters: { externalOrderId: { $eq: payload.externalOrderId } }, limit: 1 });
    const data = { ...payload, customer: customers[0].documentId } as never;
    const order = existing[0]
      ? await orderDocuments.update({ documentId: existing[0].documentId, data })
      : await orderDocuments.create({ data });
    if (!order) return ctx.badRequest('Não foi possível sincronizar a encomenda.');
    ctx.body = { documentId: order.documentId };
  },
});
