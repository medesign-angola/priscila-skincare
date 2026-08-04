function isInternalSync(): boolean {
  const context = globalThis.strapi.requestContext.get();
  const supplied = context?.request?.headers?.['x-integration-secret'];
  return !!process.env.REVIEW_INTEGRATION_SECRET && supplied === process.env.REVIEW_INTEGRATION_SECRET;
}

export default {
  beforeCreate() {
    if (!isInternalSync()) throw new Error('Os clientes são criados exclusivamente pela aplicação.');
  },
  beforeUpdate() {
    if (!isInternalSync()) throw new Error('Os dados do cliente são atualizados exclusivamente pela aplicação.');
  },
};
