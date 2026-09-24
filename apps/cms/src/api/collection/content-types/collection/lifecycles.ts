import { applyAutomaticSeo } from '../../../../seo-automation';

const source = {
  uid: 'api::collection.collection',
  titlePaths: ['name'],
  descriptionPaths: ['description'],
  imagePaths: ['thumbnailImage', 'media.desktopImage', 'details.images.0'],
  populate: ['thumbnailImage', 'media', 'details'],
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
