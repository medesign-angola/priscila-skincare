import { applyAutomaticSeo } from '../../../../seo-automation';

const source = {
  uid: 'api::category.category',
  titlePaths: ['name'],
  descriptionPaths: ['description'],
};

export default {
  async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    await applyAutomaticSeo(event, source);
  },
  async beforeUpdate(event: {
    params: { data: Record<string, unknown>; where?: Record<string, unknown> };
  }) {
    await applyAutomaticSeo(event, source);
  },
};
