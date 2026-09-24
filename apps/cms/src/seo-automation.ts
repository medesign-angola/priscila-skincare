import type { Core } from '@strapi/strapi';

declare const strapi: Core.Strapi;

type LifecycleEvent = {
  params: {
    data: Record<string, unknown>;
    where?: Record<string, unknown>;
  };
};

type SeoSource = {
  uid: string;
  fixedTitle?: string;
  titlePaths?: string[];
  descriptionPaths: string[];
  imagePaths?: string[];
  populate?: string[];
};

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function valueAt(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (Array.isArray(value)) {
      const index = Number(key);
      return Number.isInteger(index) ? value[index] : undefined;
    }

    return record(value)?.[key];
  }, source);
}

function firstValue(source: Record<string, unknown>, paths: string[]): unknown {
  for (const path of paths) {
    const value = valueAt(source, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function plainText(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const shortened = value.slice(0, limit + 1);
  const boundary = shortened.lastIndexOf(' ');
  return (
    boundary >= Math.floor(limit * 0.65)
      ? shortened.slice(0, boundary)
      : value.slice(0, limit)
  ).trim();
}

function mediaReference(value: unknown): unknown {
  if (typeof value === 'number' || typeof value === 'string') return value;
  const media = record(value);
  if (!media) return undefined;
  if (media.id !== undefined) return media.id;
  if (media.documentId !== undefined) return { documentId: media.documentId };
  if (media.connect || media.set) return value;
  return undefined;
}

async function currentEntry(
  source: SeoSource,
  event: LifecycleEvent,
): Promise<Record<string, unknown>> {
  if (!event.params.where || !Object.keys(event.params.where).length) return {};
  try {
    return (
      ((await strapi.db.query(source.uid as any).findOne({
        where: event.params.where,
        populate: [...new Set([...(source.populate ?? []), 'seo'])],
      })) as Record<string, unknown>) ?? {}
    );
  } catch {
    return {};
  }
}

function mergeSource(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...current, ...incoming };
  for (const [key, value] of Object.entries(incoming)) {
    const previous = record(current[key]);
    const next = record(value);
    if (previous && next) merged[key] = { ...previous, ...next };
  }
  return merged;
}

export async function applyAutomaticSeo(
  event: LifecycleEvent,
  source: SeoSource,
): Promise<void> {
  const current = await currentEntry(source, event);
  const merged = mergeSource(current, event.params.data);
  const title = truncateAtWord(
    plainText(source.fixedTitle ?? firstValue(merged, source.titlePaths ?? [])),
    60,
  );
  const description = truncateAtWord(
    plainText(firstValue(merged, source.descriptionPaths)),
    160,
  );
  const currentSeo = record(current.seo) ?? {};
  const incomingSeo = record(event.params.data.seo) ?? {};
  const image = mediaReference(firstValue(merged, source.imagePaths ?? []));

  event.params.data.seo = {
    ...currentSeo,
    ...incomingSeo,
    metaTitle: title || plainText(currentSeo.metaTitle),
    metaDescription: description || plainText(currentSeo.metaDescription),
    ...(image !== undefined ? { shareImage: image } : {}),
  };
}
