import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  candidateReadiness,
  relationReferences,
} from '../../../../home-readiness';
import { applyAutomaticSeo } from '../../../../seo-automation';

const { ValidationError } = errors;

declare const strapi: Core.Strapi;

type IngredientsPresentation = {
  ingredients?: unknown;
};

async function validateIngredients(
  data: Record<string, unknown>,
): Promise<void> {
  const presentation = data.ingredients as IngredientsPresentation | undefined;

  for (const reference of relationReferences(presentation?.ingredients)) {
    const { entry, issues } = await candidateReadiness(
      strapi,
      'featured-ingredient',
      reference,
    );
    if (issues.length === 0) continue;

    throw new ValidationError(
      `${entry?.name || 'Ingrediente selecionado'} não está pronto para a seção de ingredientes da página Sobre. Preencha: ${issues.join(', ')}.`,
    );
  }
}

export default {
  async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    await validateIngredients(event.params.data);
    await applyAutomaticSeo(event, {
      uid: 'api::about-page.about-page',
      titlePaths: ['heroHeadline'],
      descriptionPaths: [
        'heroDescription',
        'brand.footerDescription',
        'founderBiography',
      ],
      imagePaths: ['heroMedia.desktopImage', 'heroMedia.mobileImage'],
      populate: ['heroMedia', 'brand'],
    });
  },
  async beforeUpdate(event: {
    params: { data: Record<string, unknown>; where?: Record<string, unknown> };
  }) {
    await validateIngredients(event.params.data);
    await applyAutomaticSeo(event, {
      uid: 'api::about-page.about-page',
      titlePaths: ['heroHeadline'],
      descriptionPaths: [
        'heroDescription',
        'brand.footerDescription',
        'founderBiography',
      ],
      imagePaths: ['heroMedia.desktopImage', 'heroMedia.mobileImage'],
      populate: ['heroMedia', 'brand'],
    });
  },
};
