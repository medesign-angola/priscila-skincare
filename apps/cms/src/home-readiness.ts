import type { Core } from '@strapi/strapi';

export type HomeReadinessContext =
  | 'featured-product'
  | 'editorial-cover'
  | 'editorial-gallery'
  | 'featured-ingredient'
  | 'featured-kit'
  | 'featured-collection';

export type RelationReference = {
  id?: string | number;
  documentId?: string;
};

type ContentRecord = Record<string, unknown> & {
  id?: string | number;
  documentId?: string;
  name?: string;
};

type QueryService = {
  findOne(options: Record<string, unknown>): Promise<ContentRecord | null>;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function relationEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const relation = record(value);
  if (!relation) return value === undefined || value === null ? [] : [value];

  for (const key of ['connect', 'set', 'data']) {
    const entries = relation[key];
    if (Array.isArray(entries)) return entries;
    if (entries !== undefined && entries !== null) return [entries];
  }

  return [value];
}

export function relationReferences(value: unknown): RelationReference[] {
  const references: RelationReference[] = [];
  for (const entry of relationEntries(value)) {
    if (typeof entry === 'string' || typeof entry === 'number') {
      references.push({ id: entry });
      continue;
    }

    const relation = record(entry);
    if (!relation) continue;
    const apiData = record(relation.apiData);
    const source = apiData ?? relation;
    const id = source.id as string | number | undefined;
    const documentId = source.documentId as string | undefined;
    if (id !== undefined || documentId) references.push({ id, documentId });
  }
  return references;
}

export function firstRelationReference(
  value: unknown,
): RelationReference | null {
  return relationReferences(value)[0] ?? null;
}

export function referenceKey(reference: RelationReference | null): string | null {
  if (!reference) return null;
  return reference.documentId ??
    (reference.id === undefined ? null : String(reference.id));
}

function isFilled(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function hasRelation(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (!value) return false;
  const relation = record(value);
  if (!relation) return true;
  if (relation.id !== undefined || relation.documentId) return true;
  return relationEntries(value).length > 0;
}

function pricesOf(entry: ContentRecord): Record<string, unknown> | null {
  const directPrices = record(entry.prices);
  const commerce = record(entry.commerce);
  return directPrices ?? record(commerce?.prices);
}

function commonProductIssues(entry: ContentRecord): string[] {
  const issues: string[] = [];
  const prices = pricesOf(entry);
  if (!isFilled(entry.name)) issues.push('nome do produto');
  if (!isFilled(entry.description)) issues.push('descrição do produto');
  if (!isFilled(prices?.aoa)) issues.push('preço em kwanzas');
  if (!isFilled(prices?.eur)) issues.push('preço em euros');
  return issues;
}

function productIssues(
  entry: ContentRecord,
  context: HomeReadinessContext,
): string[] {
  const issues = commonProductIssues(entry);
  const images = Array.isArray(entry.images) ? entry.images : [];

  if (context === 'featured-product') {
    if (
      !hasRelation(entry.featuredImage) &&
      !hasRelation(entry.thumbnailImage) &&
      images.length === 0
    ) {
      issues.push('imagem para o card');
    }
  }

  if (context === 'editorial-cover') {
    const editorial = record(entry.editorial);
    if (!isFilled(editorial?.headline)) issues.push('título editorial');
    if (!isFilled(editorial?.description)) issues.push('descrição editorial');
  }

  if (context === 'editorial-gallery') {
    const editorial = record(entry.galleryEditorial);
    if (!isFilled(editorial?.headline)) {
      issues.push('título da galeria editorial');
    }
    if (!isFilled(editorial?.description)) {
      issues.push('descrição da galeria editorial');
    }
  }

  return [...new Set(issues)];
}

function kitIssues(entry: ContentRecord): string[] {
  const issues: string[] = [];
  const prices = pricesOf(entry);
  const media = record(entry.media);
  const products = Array.isArray(entry.products) ? entry.products : [];

  if (!isFilled(entry.name)) issues.push('nome do kit');
  if (!isFilled(entry.description)) issues.push('descrição do kit');
  if (!isFilled(prices?.aoa)) issues.push('preço em kwanzas');
  if (!isFilled(prices?.eur)) issues.push('preço em euros');
  if (!hasRelation(entry.thumbnailImage)) issues.push('imagem de miniatura');
  if (!hasRelation(media?.desktopImage) && !hasRelation(media?.video)) {
    issues.push('imagem ou vídeo para destaque na página inicial');
  }
  if (!entry.homePresentation) {
    issues.push('bloco Apresentação na página inicial');
  }
  if (products.length === 0) issues.push('pelo menos um produto incluído');
  return issues;
}

function collectionIssues(entry: ContentRecord): string[] {
  const issues: string[] = [];
  const media = record(entry.media);
  const products = Array.isArray(entry.products) ? entry.products : [];

  if (!isFilled(entry.name)) issues.push('nome da coleção');
  if (!isFilled(entry.description)) issues.push('descrição da coleção');
  if (!hasRelation(entry.thumbnailImage)) issues.push('imagem de miniatura');
  if (!hasRelation(media?.desktopImage) && !hasRelation(media?.video)) {
    issues.push('imagem ou vídeo para destaque na página inicial');
  }
  if (!entry.homePresentation) {
    issues.push('bloco Apresentação na página inicial');
  }
  if (products.length === 0) issues.push('pelo menos um produto relacionado');
  return issues;
}

function ingredientIssues(entry: ContentRecord): string[] {
  const issues: string[] = [];
  const editorialMedia = record(entry.editorialMedia);
  if (!isFilled(entry.name)) issues.push('nome do ingrediente');
  if (!hasRelation(entry.thumbnailImage)) issues.push('imagem de miniatura');
  if (
    !hasRelation(editorialMedia?.desktopImage) &&
    !hasRelation(editorialMedia?.mobileImage)
  ) {
    issues.push('imagem principal do ingrediente');
  }
  return issues;
}

function uidForContext(
  context: HomeReadinessContext,
):
  | 'api::product.product'
  | 'api::kit.kit'
  | 'api::collection.collection'
  | 'api::ingredient.ingredient' {
  if (context === 'featured-ingredient') {
    return 'api::ingredient.ingredient';
  }
  if (context === 'featured-kit') return 'api::kit.kit';
  if (context === 'featured-collection') return 'api::collection.collection';
  return 'api::product.product';
}

function populateForContext(context: HomeReadinessContext) {
  if (context === 'featured-ingredient') {
    return {
      thumbnailImage: true,
      editorialMedia: {
        populate: { desktopImage: true, mobileImage: true },
      },
    };
  }
  if (context === 'featured-kit') {
    return {
      prices: true,
      commerce: { populate: { prices: true } },
      thumbnailImage: true,
      media: {
        populate: { desktopImage: true, mobileImage: true, video: true },
      },
      homePresentation: true,
      products: true,
    };
  }

  if (context === 'featured-collection') {
    return {
      thumbnailImage: true,
      media: {
        populate: { desktopImage: true, mobileImage: true, video: true },
      },
      homePresentation: true,
      products: true,
    };
  }

  return {
    commerce: { populate: { prices: true } },
    featuredImage: true,
    thumbnailImage: true,
    images: true,
    editorial: true,
    galleryEditorial: true,
  };
}

export async function loadHomeCandidate(
  strapi: Core.Strapi,
  context: HomeReadinessContext,
  reference: RelationReference,
): Promise<ContentRecord | null> {
  const uid = uidForContext(context);
  const numericId =
    reference.id !== undefined && /^\d+$/.test(String(reference.id))
      ? Number(reference.id)
      : null;
  const where = numericId !== null
    ? { id: numericId }
    : { documentId: reference.documentId ?? String(reference.id ?? '') };
  const query = strapi.db.query(uid) as unknown as QueryService;
  return query.findOne({
    where,
    populate: populateForContext(context),
  });
}

export function readinessIssues(
  entry: ContentRecord | null,
  context: HomeReadinessContext,
): string[] {
  if (!entry) return ['conteúdo não encontrado'];
  if (context === 'featured-ingredient') return ingredientIssues(entry);
  if (context === 'featured-kit') return kitIssues(entry);
  if (context === 'featured-collection') return collectionIssues(entry);
  return productIssues(entry, context);
}

export async function candidateReadiness(
  strapi: Core.Strapi,
  context: HomeReadinessContext,
  reference: RelationReference,
) {
  const entry = await loadHomeCandidate(strapi, context, reference);
  return {
    entry,
    issues: readinessIssues(entry, context),
  };
}

type RelationFilterRoute = {
  context: HomeReadinessContext;
};

function relationFilterRoute(path: string): RelationFilterRoute | null {
  const decodedPath = decodeURIComponent(path);
  const match = decodedPath.match(
    /\/content-manager\/relations\/([^/]+)\/([^/]+)$/,
  );
  if (!match) return null;
  const [, model, field] = match;

  if (model === 'home.product-slot' && field === 'product') {
    return { context: 'featured-product' };
  }
  if (model === 'home.editorial-product' && field === 'product') {
    return { context: 'editorial-cover' };
  }
  if (model === 'home.editorial-gallery-product' && field === 'product') {
    return { context: 'editorial-gallery' };
  }
  if (model === 'home.ingredients-presentation' && field === 'ingredients') {
    return { context: 'featured-ingredient' };
  }
  if (model === 'api::home-page.home-page' && field === 'featuredKit') {
    return { context: 'featured-kit' };
  }
  if (
    model === 'api::home-page.home-page' &&
    field === 'featuredCollection'
  ) {
    return { context: 'featured-collection' };
  }
  return null;
}

export function registerHomeReadinessRelationFilter(
  strapi: Core.Strapi,
): void {
  strapi.server.use(async (ctx, next) => {
    const route =
      ctx.method === 'GET' ? relationFilterRoute(ctx.path) : null;
    if (!route) return next();

    const query = ctx.request.query as Record<string, unknown>;
    const requestedPage = Math.max(1, Number(query.page) || 1);
    const requestedPageSize = Math.max(1, Number(query.pageSize) || 10);
    query.page = 1;
    query.pageSize = 100;

    await next();

    const body = record(ctx.body);
    const results = Array.isArray(body?.results)
      ? (body.results as ContentRecord[])
      : null;
    if (!body || !results) return;

    try {
      const readiness = await Promise.all(
        results.map(async (result) => ({
          result,
          readiness: await candidateReadiness(strapi, route.context, {
            id: result.id,
            documentId: result.documentId,
          }),
        })),
      );
      const eligible = readiness
        .filter(({ readiness: value }) => value.issues.length === 0)
        .map(({ result }) => result);
      const start = (requestedPage - 1) * requestedPageSize;
      const total = eligible.length;

      ctx.body = {
        ...body,
        results: eligible.slice(start, start + requestedPageSize),
        pagination: {
          page: requestedPage,
          pageSize: requestedPageSize,
          pageCount: Math.max(1, Math.ceil(total / requestedPageSize)),
          total,
        },
      };
    } catch (error) {
      strapi.log.warn(
        `Não foi possível filtrar conteúdos prontos para a Home: ${String(error)}`,
      );
    }
  });
}
