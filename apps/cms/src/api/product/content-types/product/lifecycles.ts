import { errors } from '@strapi/utils';

const { ValidationError } = errors;

type RelationMutation = {
  connect?: unknown[];
  disconnect?: unknown[];
  set?: unknown[];
};

function explicitRelationCount(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== 'object') return null;

  const mutation = value as RelationMutation;
  if (Array.isArray(mutation.set)) return mutation.set.length;
  if (Array.isArray(mutation.connect) && !mutation.disconnect?.length) {
    return mutation.connect.length;
  }

  return null;
}

function validateProduct(data: Record<string, unknown>): void {
  const imageCount = explicitRelationCount(data.images);

  if (imageCount !== null && imageCount < 5) {
    throw new ValidationError(
      'Cada produto deve possuir no mínimo cinco imagens.',
    );
  }
}

export default {
  beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    validateProduct(event.params.data);
  },
  beforeUpdate(event: { params: { data: Record<string, unknown> } }) {
    validateProduct(event.params.data);
  },
};
