import type { Core } from '@strapi/strapi';
import { upsertCustomer } from '../../customer/controllers/internal-customer';

type ReviewPayload = {
  externalReviewId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAcceptsMarketing: boolean;
  customerIsActive: boolean;
  customerCreatedAt: string;
  customerUpdatedAt: string;
  productSku: string;
  rating: number;
  title: string;
  comment: string;
  recommends: boolean;
  moderationStatus: 'pending' | 'published' | 'rejected';
  submittedAt: string;
  editedAt?: string | null;
  updatedAt: string;
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sync(ctx: { request: { headers: Record<string, string | undefined>; body: ReviewPayload }; unauthorized: () => void; badRequest: (message: string) => void; body?: unknown }) {
    const expected = process.env.REVIEW_INTEGRATION_SECRET;
    const supplied = ctx.request.headers['x-integration-secret'];
    if (!expected || supplied !== expected) return ctx.unauthorized();

    const payload = ctx.request.body;
    if (!payload?.externalReviewId || !payload.productSku || !payload.customerId || !payload.customerEmail) return ctx.badRequest('Avaliação, cliente ou SKU inválido.');

    const customer = await upsertCustomer(strapi, {
      externalCustomerId: payload.customerId,
      name: payload.customerName,
      email: payload.customerEmail,
      phone: payload.customerPhone,
      acceptsMarketing: payload.customerAcceptsMarketing,
      isActive: payload.customerIsActive,
      registeredAt: payload.customerCreatedAt,
      sourceUpdatedAt: payload.customerUpdatedAt,
    });

    const products = await strapi.documents('api::product.product').findMany({
      filters: { sku: { $eq: payload.productSku } },
      limit: 1,
    });
    const product = products[0];
    if (!product) return ctx.badRequest('O produto da avaliação não existe no catálogo.');

    const existing = await strapi.documents('api::review.review').findMany({
      filters: { externalReviewId: { $eq: payload.externalReviewId } } as never,
      limit: 1,
    });
    const data = {
      externalReviewId: payload.externalReviewId,
      customerId: payload.customerId,
      name: payload.customerName || 'Cliente',
      productSku: payload.productSku,
      title: payload.title,
      comment: payload.comment,
      rating: payload.rating,
      recommends: payload.recommends,
      moderationStatus: payload.moderationStatus,
      reviewDate: payload.submittedAt,
      submittedAt: payload.submittedAt,
      sourceEditedAt: payload.editedAt ?? null,
      sourceUpdatedAt: payload.updatedAt,
      product: product.documentId,
      customer: customer.documentId,
    } as never;

    const review = existing[0]
      ? await strapi.documents('api::review.review').update({ documentId: existing[0].documentId, data })
      : await strapi.documents('api::review.review').create({ data });

    if (!review) return ctx.badRequest('Não foi possível guardar a avaliação.');
    ctx.body = { documentId: review.documentId };
  },
});
