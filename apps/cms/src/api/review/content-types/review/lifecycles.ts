import type { Core } from '@strapi/strapi';

type ReviewEvent = { result?: { externalReviewId?: string; moderationStatus?: string } };

function isInternalSync(): boolean {
  const context = globalThis.strapi.requestContext.get();
  const supplied = context?.request?.headers?.['x-integration-secret'];
  return !!process.env.REVIEW_INTEGRATION_SECRET && supplied === process.env.REVIEW_INTEGRATION_SECRET;
}

async function notifyModeration(strapi: Core.Strapi, event: ReviewEvent): Promise<void> {
  const reviewId = event.result?.externalReviewId;
  const status = event.result?.moderationStatus;
  if (!reviewId || !['published', 'rejected'].includes(status ?? '')) return;

  const apiUrl = process.env.APPLICATION_API_URL;
  const secret = process.env.REVIEW_INTEGRATION_SECRET;
  if (!apiUrl || !secret) {
    strapi.log.warn('Moderação não sincronizada: configure APPLICATION_API_URL e REVIEW_INTEGRATION_SECRET.');
    return;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/integrations/strapi/reviews/${reviewId}/moderation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Integration-Secret': secret },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`A API recusou a moderação da avaliação (${response.status}).`);
}

export default {
  beforeCreate() {
    if (!isInternalSync()) throw new Error('As avaliações são criadas exclusivamente pela aplicação.');
  },
  beforeUpdate(event: { params: { data: Record<string, unknown> } }) {
    if (isInternalSync()) return;
    const moderationStatus = event.params.data.moderationStatus;
    event.params.data = moderationStatus === undefined ? {} : { moderationStatus };
  },
  async afterUpdate(event: ReviewEvent) {
    const strapi = globalThis.strapi as Core.Strapi;
    await notifyModeration(strapi, event);
  },
};
