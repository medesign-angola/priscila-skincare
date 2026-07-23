import { errors } from '@strapi/utils';

const { ValidationError } = errors;

type RelationReference = {
  id?: string | number;
  documentId?: string;
};

type ProductSlot = {
  product?: RelationReference | string | number;
};

type EditorialProduct = {
  product?: RelationReference | string | number;
};

function referenceId(reference: unknown): string | null {
  if (typeof reference === 'string' || typeof reference === 'number') {
    return String(reference);
  }

  if (!reference || typeof reference !== 'object') return null;
  const value = reference as RelationReference;
  return value.documentId ?? (value.id === undefined ? null : String(value.id));
}

function validateUniqueProductPlacements(
  data: Record<string, unknown>,
): void {
  const featuredProducts = Array.isArray(data.featuredProducts)
    ? (data.featuredProducts as ProductSlot[])
        .map((slot) => referenceId(slot.product))
        .filter((id): id is string => Boolean(id))
    : [];
  const editorialCover = referenceId(
    (data.editorialCover as EditorialProduct | undefined)?.product,
  );
  const editorialGallery = referenceId(
    (data.editorialGallery as EditorialProduct | undefined)?.product,
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

export default {
  beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    validateUniqueProductPlacements(event.params.data);
  },
  beforeUpdate(event: { params: { data: Record<string, unknown> } }) {
    validateUniqueProductPlacements(event.params.data);
  },
};
