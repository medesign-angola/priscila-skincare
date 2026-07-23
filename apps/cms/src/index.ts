import type { Core } from '@strapi/strapi';

const PUBLIC_READ_CONTENT_TYPES = [
  'api::category.category',
  'api::size.size',
  'api::ingredient.ingredient',
  'api::product.product',
  'api::collection.collection',
  'api::kit.kit',
  'api::review.review',
  'api::testimonial.testimonial',
  'api::hero-slide.hero-slide',
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::site-setting.site-setting',
] as const;

async function ensureFrenchLocale(strapi: Core.Strapi): Promise<void> {
  if (process.env.CMS_BOOTSTRAP_LOCALES !== 'true') return;

  const localesService = strapi.plugin('i18n').service('locales');
  const locales = await localesService.find();
  if (locales.some((locale: { code: string }) => locale.code === 'fr')) return;

  await localesService.create({
    code: 'fr',
    name: 'Français (fr)',
    isDefault: false,
  });
}

async function ensurePublicReadPermissions(
  strapi: Core.Strapi,
): Promise<void> {
  if (process.env.CMS_BOOTSTRAP_PUBLIC_READ !== 'true') return;

  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!role) return;

  for (const contentType of PUBLIC_READ_CONTENT_TYPES) {
    for (const operation of ['find', 'findOne']) {
      const action = `${contentType}.${operation}`;
      const existingPermission = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: role.id } });

      if (!existingPermission) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({ data: { action, role: role.id } });
      }
    }
  }
}

async function seedBaseData(strapi: Core.Strapi): Promise<void> {
  if (process.env.CMS_SEED_BASE_DATA !== 'true') return;

  const existingSizes = await strapi.documents('api::size.size').findMany({
    limit: 1,
  });
  if (existingSizes.length > 0) return;

  const sizes = [
    { label: '50 ml', value: '50ML', order: 1 },
    { label: '100 ml', value: '100ML', order: 2 },
    { label: '150 g', value: '150G', order: 3 },
    { label: '500 ml', value: '500ML', order: 4 },
  ];

  for (const size of sizes) {
    await strapi.documents('api::size.size').create({ data: size });
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureFrenchLocale(strapi);
    await ensurePublicReadPermissions(strapi);
    await seedBaseData(strapi);
  },
};
