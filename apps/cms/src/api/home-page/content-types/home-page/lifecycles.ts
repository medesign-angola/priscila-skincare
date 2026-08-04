import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  candidateReadiness,
  firstRelationReference,
  hasRelation,
  referenceKey,
  relationReferences,
  type HomeReadinessContext,
  type RelationReference,
} from '../../../../home-readiness';

const { ValidationError } = errors;

declare const strapi: Core.Strapi;

type ProductSlot = {
  product?: unknown;
};

type EditorialProduct = {
  product?: unknown;
  media?: Record<string, unknown> | null;
};

type IngredientsPresentation = {
  ingredients?: unknown;
};

const MAX_FEATURED_PRODUCTS = 4;

function validateUniqueProductPlacements(
  data: Record<string, unknown>,
): void {
  const featuredProducts = Array.isArray(data.featuredProducts)
    ? (data.featuredProducts as ProductSlot[])
        .map((slot) => referenceKey(firstRelationReference(slot.product)))
        .filter((id): id is string => Boolean(id))
    : [];
  const editorialCover = referenceKey(
    firstRelationReference(
      (data.editorialCover as EditorialProduct | undefined)?.product,
    ),
  );
  const editorialGallery = referenceKey(
    firstRelationReference(
      (data.editorialGallery as EditorialProduct | undefined)?.product,
    ),
  );
  const placements = [
    ...featuredProducts,
    editorialCover,
    editorialGallery,
  ].filter((id): id is string => Boolean(id));

  if (new Set(placements).size !== placements.length) {
    throw new ValidationError(
      'O mesmo produto não pode ser repetido entre produtos destacados, editorial principal e galeria editorial.',
    );
  }
}

async function validateCandidate(
  context: HomeReadinessContext,
  reference: RelationReference | null,
  sectionLabel: string,
): Promise<void> {
  if (!reference) return;
  const { entry, issues } = await candidateReadiness(
    strapi,
    context,
    reference,
  );
  if (issues.length === 0) return;

  const contentName = entry?.name || 'Conteúdo selecionado';
  throw new ValidationError(
    `${contentName} não está pronto para ${sectionLabel}. Preencha: ${issues.join(', ')}.`,
  );
}

function validateEditorialConfiguration(
  editorial: EditorialProduct | undefined,
  sectionLabel: string,
): void {
  if (!editorial || !firstRelationReference(editorial.product)) return;
  const media = editorial.media;
  if (
    !media ||
    (!hasRelation(media.desktopImage) && !hasRelation(media.video))
  ) {
    throw new ValidationError(
      `Adicione uma imagem para computador ou um vídeo em ${sectionLabel}.`,
    );
  }

}

async function validateHomeReadiness(
  data: Record<string, unknown>,
): Promise<void> {
  const featuredProducts = Array.isArray(data.featuredProducts)
    ? (data.featuredProducts as ProductSlot[])
    : [];

  if (featuredProducts.length > MAX_FEATURED_PRODUCTS) {
    throw new ValidationError(
      `A seção Produtos destacados aceita no máximo ${MAX_FEATURED_PRODUCTS} produtos.`,
    );
  }

  for (const slot of featuredProducts) {
    await validateCandidate(
      'featured-product',
      firstRelationReference(slot.product),
      'a seção Produtos destacados',
    );
  }

  const editorialCover = data.editorialCover as EditorialProduct | undefined;
  const editorialGallery = data.editorialGallery as EditorialProduct | undefined;
  validateEditorialConfiguration(
    editorialCover,
    'Produto editorial com vídeo ou imagem',
  );

  await validateCandidate(
    'editorial-cover',
    firstRelationReference(editorialCover?.product),
    'o editorial principal',
  );
  await validateCandidate(
    'editorial-gallery',
    firstRelationReference(editorialGallery?.product),
    'a galeria editorial',
  );
  await validateCandidate(
    'featured-kit',
    firstRelationReference(data.featuredKit),
    'Kit em destaque',
  );
  await validateCandidate(
    'featured-collection',
    firstRelationReference(data.featuredCollection),
    'Coleção em destaque',
  );

  const ingredientsPresentation = data.ingredients as
    | IngredientsPresentation
    | undefined;
  for (const ingredient of relationReferences(
    ingredientsPresentation?.ingredients,
  )) {
    await validateCandidate(
      'featured-ingredient',
      ingredient,
      'a seção de ingredientes da página inicial',
    );
  }
}

async function validate(data: Record<string, unknown>): Promise<void> {
  validateUniqueProductPlacements(data);
  await validateHomeReadiness(data);
}

export default {
  async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    await validate(event.params.data);
  },
  async beforeUpdate(event: { params: { data: Record<string, unknown> } }) {
    await validate(event.params.data);
  },
};
