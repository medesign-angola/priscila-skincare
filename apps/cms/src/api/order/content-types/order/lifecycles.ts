import type { Core } from '@strapi/strapi';
type Event = { result?: { externalOrderId?: string; status?: string }; params: { data: Record<string, unknown> } };
const internal = () => {
  const supplied = globalThis.strapi.requestContext.get()?.request?.headers?.['x-integration-secret'];
  return !!process.env.REVIEW_INTEGRATION_SECRET && supplied === process.env.REVIEW_INTEGRATION_SECRET;
};
export default {
  beforeCreate() { if (!internal()) throw new Error('As encomendas são criadas exclusivamente pela loja.'); },
  beforeUpdate(event: Event) { if (!internal()) { const status = event.params.data.status; event.params.data = status === undefined ? {} : { status }; } },
  async afterUpdate(event: Event) {
    if (internal()) return;
    const id = event.result?.externalOrderId; const status = event.result?.status;
    const api = process.env.APPLICATION_API_URL; const secret = process.env.REVIEW_INTEGRATION_SECRET;
    if (!id || !status || !api || !secret) return;
    const response = await fetch(`${api.replace(/\/$/, '')}/api/v1/integrations/strapi/orders/${id}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Integration-Secret': secret }, body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`A API recusou o estado da encomenda (${response.status}).`);
  },
};
