import type { Core } from '@strapi/strapi';

export type CustomerSyncPayload = {
  externalCustomerId: string;
  name: string;
  email: string;
  phone?: string | null;
  acceptsMarketing: boolean;
  isActive: boolean;
  registeredAt: string;
  sourceUpdatedAt: string;
};

export async function upsertCustomer(strapi: Core.Strapi, payload: CustomerSyncPayload) {
  const existing = await strapi.documents('api::customer.customer').findMany({
    filters: { externalCustomerId: { $eq: payload.externalCustomerId } } as never,
    limit: 1,
  });
  const data = {
    externalCustomerId: payload.externalCustomerId,
    name: payload.name || 'Cliente',
    email: payload.email,
    phone: payload.phone || null,
    acceptsMarketing: payload.acceptsMarketing,
    isActive: payload.isActive,
    registeredAt: payload.registeredAt,
    sourceUpdatedAt: payload.sourceUpdatedAt,
  } as never;
  const customer = existing[0]
    ? strapi.documents('api::customer.customer').update({ documentId: existing[0].documentId, data })
    : strapi.documents('api::customer.customer').create({ data });
  const synchronized = await customer;
  if (!synchronized) throw new Error('Não foi possível sincronizar o cliente.');
  const legacyReviews = await strapi.documents('api::review.review').findMany({
    filters: { customerId: { $eq: payload.externalCustomerId } } as never,
  });
  for (const review of legacyReviews) {
    await strapi.documents('api::review.review').update({
      documentId: review.documentId,
      data: { customer: synchronized.documentId } as never,
    });
  }
  return synchronized;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sync(ctx: { request: { headers: Record<string, string | undefined>; body: CustomerSyncPayload }; unauthorized: () => void; badRequest: (message: string) => void; body?: unknown }) {
    const expected = process.env.REVIEW_INTEGRATION_SECRET;
    const supplied = ctx.request.headers['x-integration-secret'];
    if (!expected || supplied !== expected) return ctx.unauthorized();
    const payload = ctx.request.body;
    if (!payload?.externalCustomerId || !payload.email) return ctx.badRequest('Cliente inválido.');
    const customer = await upsertCustomer(strapi, payload);
    if (!customer) return ctx.badRequest('Não foi possível sincronizar o cliente.');
    ctx.body = { documentId: customer.documentId };
  },
});
