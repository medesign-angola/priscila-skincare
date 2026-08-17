import {
  CmsActionTarget,
  CmsAboutBrandSection,
  CmsAboutPillarsSection,
  CmsAboutPage,
  CmsBundleDetails,
  CmsCategory,
  CmsHeroAction,
  CmsHeroSlide,
  CmsHomePage,
  CmsIngredient,
  CmsIngredientsPresentation,
  CmsKit,
  CmsMedia,
  CmsMediaPresentation,
  CmsProduct,
  CmsProductCollection,
  CmsSize,
  CmsSiteSetting,
  CmsTestimonialsPresentation,
} from '../models/cms.interface';
import {
  AboutBrandPresentation,
  LocalizedAboutBrandPresentation,
  LocalizedAboutPagePresentation,
} from '../models/about-page.interface';
import { Category } from '../models/category.interface';
import {
  HeroSlide,
  HeroSlideAction,
  HeroSlidePrice,
} from '../models/hero-slide.interface';
import {
  Product,
  ProductBadge,
  ProductTranslation,
} from '../models/product.interface';
import { Size } from '../models/size.interface';
import { Kit, KitTranslation } from '../models/kit.interface';
import {
  Collection,
  CollectionTranslation,
} from '../models/collection.interface';
import {
  HomeIngredientsPresentation,
  Ingredient,
} from '../models/ingredient.interface';
import { HomeTestimonialsPresentation } from '../models/testimonial.interface';
import {
  LocalizedSiteSettingPresentation,
  SiteSocialLink,
} from '../models/site-setting.interface';

const INTERNAL_PAGE_ROUTES: Record<string, string> = {
  produtos: '/produtos',
  sobre: '/sobre',
  perfil: '/conta/perfil',
  encomendas: '/conta/encomendas',
};

const EMPTY_MEDIA = '';

function mapBundleDetails(details: CmsBundleDetails | null | undefined, baseUrl: string) {
  const before = mediaUrl(baseUrl, details?.results?.comparison?.before);
  const after = mediaUrl(baseUrl, details?.results?.comparison?.after);
  return {
    images: (details?.images ?? []).map((image) => mediaUrl(baseUrl, image)).filter(Boolean),
    howToUse: {
      editorialImage: mediaPresentationUrl(baseUrl, details?.usageMedia) || undefined,
      steps: [...(details?.usageSteps ?? [])].sort((a, b) => a.order - b.order).map((step) => ({
        order: step.order, name: step.name, description: step.description,
      })),
    },
    result: {
      data: (details?.results?.statistics ?? []).map((stat) => ({ percentage: stat.percentage, description: stat.description })),
      description: details?.results?.description ?? '',
      images: { before, after },
    },
  };
}

function asNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function absoluteCmsUrl(baseUrl: string, url?: string | null): string {
  if (!url) return EMPTY_MEDIA;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function mediaUrl(baseUrl: string, media?: CmsMedia | null): string {
  return absoluteCmsUrl(baseUrl, media?.url);
}

function mediaPresentationUrl(
  baseUrl: string,
  media?: CmsMediaPresentation | null,
): string {
  return mediaUrl(baseUrl, media?.video ?? media?.desktopImage);
}

function mapPrices(
  commerce: CmsProduct['commerce'] | undefined | null,
  directPrices?: CmsActionTarget['prices'],
): HeroSlidePrice | undefined {
  const prices = directPrices ?? commerce?.prices;
  if (!prices) return undefined;
  return {
    AOA: asNumber(prices.aoa),
    EUR: asNumber(prices.eur),
  };
}

function mapHeroAction(action?: CmsHeroAction): HeroSlideAction | undefined {
  if (!action?.label) return undefined;

  switch (action.__component) {
    case 'action.product': {
      const target = action.product;
      if (!target) return undefined;
      return {
        label: action.label,
        href: `/produtos/${encodeURIComponent(target.slug || target.documentId)}`,
        external: false,
        openInNewTab: false,
        price: mapPrices(target.commerce, target.prices),
      };
    }
    case 'action.kit': {
      const target = action.kit;
      if (!target) return undefined;
      return {
        label: action.label,
        href: `/produtos/kit/${encodeURIComponent(target.slug || target.documentId)}`,
        external: false,
        openInNewTab: false,
        price: mapPrices(target.commerce, target.prices),
      };
    }
    case 'action.collection': {
      const target = action.collection;
      if (!target) return undefined;
      return {
        label: action.label,
        href: `/produtos/colecao/${encodeURIComponent(target.slug || target.documentId)}`,
        external: false,
        openInNewTab: false,
      };
    }
    case 'action.category': {
      const target = action.category;
      if (!target) return undefined;
      return {
        label: action.label,
        href: `/produtos/categoria/${encodeURIComponent(target.slug || target.documentId)}`,
        external: false,
        openInNewTab: false,
      };
    }
    case 'action.internal-page': {
      const href = INTERNAL_PAGE_ROUTES[action.page];
      return href
        ? {
            label: action.label,
            href,
            external: false,
            openInNewTab: false,
          }
        : undefined;
    }
    case 'action.external-link':
      return /^https?:\/\//i.test(action.url)
        ? {
            label: action.label,
            href: action.url,
            external: true,
            openInNewTab: action.openInNewTab ?? true,
          }
        : undefined;
  }
}

export function mapCmsHeroSlide(
  slide: CmsHeroSlide,
  baseUrl: string,
): HeroSlide | null {
  const videoUrl = mediaUrl(baseUrl, slide.media?.video);
  const desktopImageUrl = mediaUrl(baseUrl, slide.media?.desktopImage);
  const primaryUrl = videoUrl || desktopImageUrl;
  if (!primaryUrl) return null;

  const focalPointX = asNumber(slide.media.focalPointX ?? 50);
  const focalPointY = asNumber(slide.media.focalPointY ?? 50);

  return {
    id: slide.documentId || String(slide.id),
    name: slide.name,
    label: slide.label,
    headline: slide.headline,
    description: slide.description ?? undefined,
    order: slide.order,
    media: {
      type: videoUrl ? 'video' : 'image',
      url: primaryUrl,
      mobileUrl:
        mediaUrl(baseUrl, slide.media.mobileImage) || desktopImageUrl || undefined,
      placeholderUrl:
        mediaUrl(baseUrl, slide.media.placeholder) || undefined,
      alt: slide.media.alt || slide.headline,
      objectFit: slide.media.objectFit ?? 'cover',
      objectPosition: `${focalPointX}% ${focalPointY}%`,
      hasNoise: slide.media.hasNoise ?? false,
      presentation: slide.presentation ?? 'split-right',
    },
    action: mapHeroAction(slide.cta?.[0]),
  };
}

function mapBadge(product: CmsProduct): ProductBadge | undefined {
  const badge = product.commerce.badge;
  if (!badge || badge.type === 'none') return undefined;
  if (badge.type === 'discount') {
    return {
      type: 'discount',
      percentage: Math.max(0, Math.min(100, badge.percentage ?? 0)),
    };
  }
  return { type: badge.type };
}

function mapProductTranslation(
  product: CmsProduct,
  baseUrl: string,
): ProductTranslation {
  const ingredients = [...(product.ingredients ?? [])];
  const reviews = [...(product.reviews ?? [])].filter(
    (review) => !review.moderationStatus || review.moderationStatus === 'published',
  );
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0;
  const before = mediaUrl(baseUrl, product.results?.comparison?.before);
  const after = mediaUrl(baseUrl, product.results?.comparison?.after);

  return {
    name: product.name,
    description: product.description,
    additionalDescription: product.additionalDescription ?? undefined,
    editorial: product.editorial
      ? {
          headline: product.editorial.headline,
          description: product.editorial.description,
          footnote: product.editorial.footnote ?? '',
        }
      : undefined,
    galleryEditorial: product.galleryEditorial
      ? {
          headline: product.galleryEditorial.headline,
          description: product.galleryEditorial.description,
        }
      : undefined,
    highlights: [...(product.highlights ?? [])]
      .sort((first, second) => first.order - second.order)
      .map((highlight) => highlight.title),
    benefits: {
      mainImage: mediaPresentationUrl(baseUrl, product.benefitsMainMedia),
      sections: [...(product.benefits ?? [])]
        .sort((first, second) => first.order - second.order)
        .map((benefit) => ({
          title: benefit.title,
          description: benefit.description,
          images: benefit.images
            ?.map((image) => mediaUrl(baseUrl, image))
            .filter(Boolean),
        })),
    },
    ingredients: {
      name: ingredients[0]?.name ?? '',
      description: ingredients[0]?.description ?? '',
      mainIngredientsImages: ingredients
        .slice(0, 2)
        .map((ingredient) => mediaUrl(baseUrl, ingredient.thumbnailImage))
        .filter(Boolean),
      bodyResultImage:
        mediaPresentationUrl(baseUrl, ingredients[0]?.editorialMedia) ||
        mediaPresentationUrl(baseUrl, product.benefitsMainMedia),
      items: ingredients.map((ingredient) => ({
        name: ingredient.name,
        description: ingredient.description,
        image: mediaUrl(baseUrl, ingredient.thumbnailImage) || undefined,
      })),
      editorialImage:
        mediaPresentationUrl(baseUrl, ingredients[0]?.editorialMedia) ||
        undefined,
    },
    howToUse: {
      editorialImage:
        mediaPresentationUrl(baseUrl, product.usageMedia) || undefined,
      steps: [...(product.usageSteps ?? [])]
        .sort((first, second) => first.order - second.order)
        .map((step) => ({
          order: step.order,
          name: step.name,
          description: step.description,
        })),
    },
    result: {
      data: (product.results?.statistics ?? []).map((statistic) => ({
        percentage: statistic.percentage,
        description: statistic.description,
      })),
      description: product.results?.description ?? '',
      images: {
        before,
        after,
      },
    },
    reviews: {
      averageRating,
      totalReviews: reviews.length,
      userReviews: reviews.map((review) => ({
        id: review.documentId,
        name: review.name,
        title: review.title ?? undefined,
        comment: review.comment,
        rating: review.rating,
        recommends: review.recommends ?? undefined,
        date: review.reviewDate ?? review.createdAt,
        status: 'published',
      })),
    },
  };
}

export function mapCmsProduct(
  ptProduct: CmsProduct,
  frProduct: CmsProduct | undefined,
  baseUrl: string,
): Product {
  const ptTranslation = mapProductTranslation(ptProduct, baseUrl);
  const frTranslation = frProduct
    ? mapProductTranslation(frProduct, baseUrl)
    : ptTranslation;
  const images = (ptProduct.images ?? [])
    .map((image) => mediaUrl(baseUrl, image))
    .filter(Boolean);
  const thumbnailImage =
    mediaUrl(baseUrl, ptProduct.thumbnailImage) || images[0] || EMPTY_MEDIA;

  return {
    id: ptProduct.documentId || String(ptProduct.id),
    sku: ptProduct.sku,
    slug: ptProduct.slug,
    featured: false,
    categoryId:
      ptProduct.category?.documentId ??
      (ptProduct.category?.id ? String(ptProduct.category.id) : ''),
    sizeIds: (ptProduct.sizes ?? []).map(
      (size) => size.documentId || String(size.id),
    ),
    images: images.length > 0 ? images : [thumbnailImage].filter(Boolean),
    thumbnailImage,
    featuredImage:
      mediaUrl(baseUrl, ptProduct.featuredImage) || undefined,
    commerce: {
      prices: {
        AOA: asNumber(ptProduct.commerce.prices.aoa),
        EUR: asNumber(ptProduct.commerce.prices.eur),
      },
      availability: ptProduct.commerce.availability,
      badge: mapBadge(ptProduct),
    },
    translations: {
      pt: ptTranslation,
      fr: frTranslation,
    },
  };
}

export function mergeCmsProducts(
  cmsProducts: Product[],
  fallbackProducts: Product[],
): Product[] {
  const cmsKeys = new Set(
    cmsProducts.flatMap((product) => [
      product.slug?.toLocaleLowerCase(),
      product.translations.pt.name.trim().toLocaleLowerCase(),
    ]),
  );

  return [
    ...cmsProducts,
    ...fallbackProducts.filter(
      (product) =>
        !cmsKeys.has(product.slug?.toLocaleLowerCase()) &&
        !cmsKeys.has(product.translations.pt.name.trim().toLocaleLowerCase()),
    ),
  ];
}

function mapKitTranslation(kit: CmsKit): KitTranslation {
  return {
    name: kit.name,
    collection: '',
    description: kit.description,
  };
}

function homeKitTranslation(
  kit: CmsKit,
  fallbackKit: CmsKit = kit,
) {
  const presentation = kit.homePresentation;
  const fallbackPresentation = fallbackKit.homePresentation;

  return {
    editorialTitle:
      presentation?.editorialTitle ||
      kit.name ||
      fallbackPresentation?.editorialTitle ||
      fallbackKit.name,
    editorialDescription:
      presentation?.editorialDescription ||
      kit.description ||
      fallbackPresentation?.editorialDescription ||
      fallbackKit.description,
    editorialFootnote:
      presentation?.editorialFootnote ||
      fallbackPresentation?.editorialFootnote ||
      '',
    finderDescription:
      presentation?.finderDescription ||
      kit.description ||
      fallbackPresentation?.finderDescription ||
      fallbackKit.description ||
      kit.name,
  };
}

export function mapCmsKit(
  ptKit: CmsKit,
  frKit: CmsKit | undefined,
  baseUrl: string,
): Kit {
  const videoUrl = mediaUrl(baseUrl, ptKit.media?.video);
  const desktopImageUrl = mediaUrl(baseUrl, ptKit.media?.desktopImage);
  const thumbnailImageUrl = mediaUrl(baseUrl, ptKit.thumbnailImage);
  const mediaUrlValue = videoUrl || desktopImageUrl || thumbnailImageUrl;

  return {
    id: ptKit.documentId || String(ptKit.id),
    slug: ptKit.slug,
    name: ptKit.name,
    collection: '',
    description: ptKit.description,
    price: asNumber(ptKit.prices?.aoa ?? ptKit.commerce?.prices?.aoa),
    prices: { AOA: asNumber(ptKit.prices?.aoa ?? ptKit.commerce?.prices?.aoa), EUR: asNumber(ptKit.prices?.eur ?? ptKit.commerce?.prices?.eur) },
    currency: 'Kz',
    mediaType: videoUrl ? 'video' : 'image',
    mediaUrl: mediaUrlValue,
    mediaStyle: 'cover',
    thumbnailImage: thumbnailImageUrl,
    placeholderUrl:
      mediaUrl(baseUrl, ptKit.media?.placeholder) || undefined,
    productIds: (ptKit.products ?? []).map(
      (product) => product.documentId || String(product.id),
    ),
    relatedProductIds: (ptKit.relatedProducts ?? []).map((product) => product.documentId || String(product.id)),
    details: ptKit.details ? {
      pt: mapBundleDetails(ptKit.details, baseUrl),
      fr: mapBundleDetails(frKit?.details ?? ptKit.details, baseUrl),
    } : undefined,
    featured: false,
    translations: {
      pt: mapKitTranslation(ptKit),
      fr: frKit ? mapKitTranslation(frKit) : mapKitTranslation(ptKit),
    },
    home: ptKit.homePresentation
      ? {
          order: ptKit.homePresentation.order,
          thumbnailImage: thumbnailImageUrl,
          mediaType: videoUrl ? 'video' : 'image',
          mediaUrl: mediaUrlValue,
          mediaStyle: 'split-right',
          placeholderUrl:
            mediaUrl(baseUrl, ptKit.media?.placeholder) || undefined,
          translations: {
            pt: homeKitTranslation(ptKit),
            fr: homeKitTranslation(frKit ?? ptKit, ptKit),
          },
        }
      : undefined,
  };
}

export function mergeCmsKits(
  cmsKits: Kit[],
  fallbackKits: Kit[],
): Kit[] {
  const mergedCmsKits = cmsKits.map((kit) => {
    const fallback = fallbackKits.find(
      (candidate) =>
        (kit.slug &&
          candidate.slug?.toLocaleLowerCase() ===
            kit.slug.toLocaleLowerCase()) ||
        candidate.name.trim().toLocaleLowerCase() ===
          kit.name.trim().toLocaleLowerCase(),
    );
    if (!fallback) return kit;

    return {
      ...fallback,
      ...kit,
      collection: fallback.collection,
      featured: fallback.featured,
      home: kit.home ?? fallback.home,
      translations: {
        pt: {
          ...fallback.translations.pt,
          ...kit.translations.pt,
          collection: fallback.translations.pt.collection,
        },
        fr: {
          ...fallback.translations.fr,
          ...kit.translations.fr,
          collection: fallback.translations.fr.collection,
        },
      },
    };
  });
  const cmsKeys = new Set(
    mergedCmsKits.flatMap((kit) => [
      kit.slug?.toLocaleLowerCase(),
      kit.name.trim().toLocaleLowerCase(),
    ]),
  );

  return [
    ...mergedCmsKits,
    ...fallbackKits.filter(
      (kit) =>
        !cmsKeys.has(kit.slug?.toLocaleLowerCase()) &&
        !cmsKeys.has(kit.name.trim().toLocaleLowerCase()),
    ),
  ];
}

function mapCollectionTranslation(
  collection: CmsProductCollection,
): CollectionTranslation {
  return {
    name: collection.name,
    description: collection.description,
  };
}

function homeCollectionTranslation(
  collection: CmsProductCollection,
  fallbackCollection: CmsProductCollection = collection,
) {
  const presentation = collection.homePresentation;
  const fallbackPresentation = fallbackCollection.homePresentation;

  return {
    title:
      presentation?.title ||
      collection.name ||
      fallbackPresentation?.title ||
      fallbackCollection.name,
    description:
      presentation?.description ||
      collection.description ||
      fallbackPresentation?.description ||
      fallbackCollection.description,
    footnote:
      presentation?.footnote || fallbackPresentation?.footnote || '',
  };
}

export function mapCmsCollection(
  ptCollection: CmsProductCollection,
  frCollection: CmsProductCollection | undefined,
  baseUrl: string,
): Collection {
  const thumbnailImage = mediaUrl(baseUrl, ptCollection.thumbnailImage);
  const videoUrl = mediaUrl(baseUrl, ptCollection.media?.video);
  const desktopImageUrl = mediaUrl(
    baseUrl,
    ptCollection.media?.desktopImage,
  );
  const presentationUrl = videoUrl || desktopImageUrl || thumbnailImage;

  return {
    id: ptCollection.documentId || String(ptCollection.id),
    name: ptCollection.name,
    slug: ptCollection.slug,
    description: ptCollection.description,
    thumbnailImage,
    productIds: (ptCollection.products ?? []).map(
      (product) => product.documentId || String(product.id),
    ),
    prices: ptCollection.prices ? { AOA: asNumber(ptCollection.prices.aoa), EUR: asNumber(ptCollection.prices.eur) } : undefined,
    relatedProductIds: (ptCollection.relatedProducts ?? []).map((product) => product.documentId || String(product.id)),
    details: ptCollection.details ? {
      pt: mapBundleDetails(ptCollection.details, baseUrl),
      fr: mapBundleDetails(frCollection?.details ?? ptCollection.details, baseUrl),
    } : undefined,
    translations: {
      pt: mapCollectionTranslation(ptCollection),
      fr: frCollection
        ? mapCollectionTranslation(frCollection)
        : mapCollectionTranslation(ptCollection),
    },
    media: presentationUrl
      ? {
          type: videoUrl ? 'video' : 'image',
          url: presentationUrl,
          posterUrl:
            mediaUrl(baseUrl, ptCollection.media?.placeholder) ||
            thumbnailImage ||
            undefined,
        }
      : undefined,
    home: ptCollection.homePresentation
      ? {
          order: ptCollection.homePresentation.order,
          translations: {
            pt: homeCollectionTranslation(ptCollection),
            fr: homeCollectionTranslation(
              frCollection ?? ptCollection,
              ptCollection,
            ),
          },
        }
      : undefined,
  };
}

export function mergeCmsCollections(
  cmsCollections: Collection[],
  fallbackCollections: Collection[],
): Collection[] {
  const cmsKeys = new Set(
    cmsCollections.flatMap((collection) => [
      collection.slug.toLocaleLowerCase(),
      collection.name.trim().toLocaleLowerCase(),
    ]),
  );

  return [
    ...cmsCollections,
    ...fallbackCollections.filter(
      (collection) =>
        !cmsKeys.has(collection.slug.toLocaleLowerCase()) &&
        !cmsKeys.has(collection.name.trim().toLocaleLowerCase()),
    ),
  ];
}

export function mapCmsFeaturedProductIds(
  homePage: CmsHomePage | null | undefined,
): string[] {
  const orderedIds = [...(homePage?.featuredProducts ?? [])]
    .sort((first, second) => first.order - second.order)
    .map(
      (slot) =>
        slot.product?.documentId ||
        (slot.product?.id ? String(slot.product.id) : ''),
    )
    .filter(Boolean);

  return [...new Set(orderedIds)];
}

export function mapCmsEditorialCover(
  homePage: CmsHomePage | null | undefined,
  baseUrl: string,
) {
  const editorial = homePage?.editorialCover;
  const product = editorial?.product;
  const media = editorial?.media;
  const productId =
    product?.documentId || (product?.id ? String(product.id) : '');
  const videoUrl = mediaUrl(baseUrl, media?.video);
  const imageUrl = mediaUrl(baseUrl, media?.desktopImage);
  const presentationUrl = videoUrl || imageUrl;
  if (!productId || !presentationUrl) return null;

  return {
    productId,
    mediaType: videoUrl ? ('video' as const) : ('image' as const),
    mediaUrl: presentationUrl,
    placeholderUrl: mediaUrl(baseUrl, media?.placeholder) || undefined,
    hasNoise: media?.hasNoise ?? false,
  };
}

export function mapCmsEditorialGalleryProductId(
  homePage: CmsHomePage | null | undefined,
): string | null {
  const product = homePage?.editorialGallery?.product;
  if (!product) return null;
  return product.documentId || (product.id ? String(product.id) : null);
}

export function mapCmsFeaturedKitId(
  homePage: CmsHomePage | null | undefined,
): string | null {
  const featuredKit = homePage?.featuredKit;
  if (!featuredKit) return null;

  return (
    featuredKit.documentId ||
    (featuredKit.id ? String(featuredKit.id) : null)
  );
}

export function mapCmsFeaturedCollectionId(
  homePage: CmsHomePage | null | undefined,
): string | null {
  const featuredCollection = homePage?.featuredCollection;
  if (!featuredCollection) return null;

  return (
    featuredCollection.documentId ||
    (featuredCollection.id ? String(featuredCollection.id) : null)
  );
}

export function mapCmsHomeBrandPillars(
  section: CmsAboutPillarsSection | null | undefined,
  fallbackSection?: CmsAboutPillarsSection | null,
) {
  const resolved = section ?? fallbackSection;
  if (!resolved) return null;

  const fallbackItems = new Map(
    (fallbackSection?.items ?? []).map((item) => [item.order, item]),
  );
  const items = [...(resolved.items ?? fallbackSection?.items ?? [])]
    .sort((first, second) => first.order - second.order)
    .map((item) => {
      const fallback = fallbackItems.get(item.order) ?? item;
      return {
        order: item.order,
        title: item.title || fallback.title,
        description: item.description || fallback.description || '',
      };
    });

  return {
    title: resolved.title || fallbackSection?.title || '',
    items,
  };
}

function ingredientPosition(
  media?: CmsMediaPresentation | null,
): string {
  const x = Number(media?.focalPointX);
  const y = Number(media?.focalPointY);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 'center';
  const clamp = (value: number) => Math.min(100, Math.max(0, value));
  return `${clamp(x)}% ${clamp(y)}%`;
}

export function mapCmsIngredients(
  ptIngredients: CmsIngredient[],
  frIngredients: CmsIngredient[],
  baseUrl: string,
): Ingredient[] {
  const frenchByDocumentId = new Map(
    frIngredients.map((ingredient) => [ingredient.documentId, ingredient]),
  );

  return ptIngredients.map((ingredient) => {
    const french = frenchByDocumentId.get(ingredient.documentId);
    return {
      id: ingredient.documentId || String(ingredient.id),
      thumbnailImage: mediaUrl(baseUrl, ingredient.thumbnailImage),
      editorialImage: mediaUrl(
        baseUrl,
        ingredient.editorialMedia?.desktopImage ??
          ingredient.editorialMedia?.mobileImage,
      ),
      editorialPosition: ingredientPosition(ingredient.editorialMedia),
      translations: {
        pt: { name: ingredient.name },
        fr: { name: french?.name ?? ingredient.name },
      },
    };
  });
}

export function mapCmsIngredientsPresentation(
  ptPresentation?: CmsIngredientsPresentation | null,
  frPresentation?: CmsIngredientsPresentation | null,
): HomeIngredientsPresentation | null {
  const ingredients = ptPresentation?.ingredients ?? [];
  if (!ptPresentation || ingredients.length === 0) return null;

  const ingredientIds = ingredients
    .map(
      (ingredient) =>
        ingredient.documentId ||
        (ingredient.id ? String(ingredient.id) : ''),
    )
    .filter(Boolean);
  if (ingredientIds.length === 0) return null;

  const french = frPresentation ?? ptPresentation;
  return {
    ingredientIds,
    initialIngredientId: ingredientIds[0],
    translations: {
      pt: {
        headline: ptPresentation.headline,
        description: ptPresentation.description,
        footnote: ptPresentation.footnote,
      },
      fr: {
        headline: french.headline || ptPresentation.headline,
        description: french.description || ptPresentation.description,
        footnote: french.footnote || ptPresentation.footnote,
      },
    },
  };
}

export function mapCmsTestimonialsPresentation(
  ptPresentation: CmsTestimonialsPresentation | null | undefined,
  frPresentation: CmsTestimonialsPresentation | null | undefined,
  baseUrl: string,
): HomeTestimonialsPresentation | null {
  if (!ptPresentation) return null;

  const mapTestimonials = (presentation: CmsTestimonialsPresentation) =>
    [...(presentation.testimonials ?? [])]
      .sort((first, second) => first.order - second.order)
      .flatMap((testimonial) => {
        const videoUrl = mediaUrl(baseUrl, testimonial.video);
        if (!videoUrl) return [];

        return [
          {
            id: testimonial.documentId || String(testimonial.id),
            authorLabel: testimonial.name,
            videoUrl,
            posterUrl: mediaUrl(baseUrl, testimonial.poster) || undefined,
            order: testimonial.order,
          },
        ];
      });

  const portugueseTestimonials = mapTestimonials(ptPresentation);

  if (portugueseTestimonials.length === 0) return null;

  const french = frPresentation ?? ptPresentation;
  const frenchTestimonials = mapTestimonials(french);
  return {
    translations: {
      pt: {
        title: ptPresentation.title,
        description: ptPresentation.description,
      },
      fr: {
        title: french.title || ptPresentation.title,
        description: french.description || ptPresentation.description,
      },
    },
    testimonials: {
      pt: portugueseTestimonials,
      fr:
        frenchTestimonials.length > 0
          ? frenchTestimonials
          : portugueseTestimonials,
    },
  };
}

function mapAboutBrandTranslation(
  brand: CmsAboutBrandSection,
  fallbackBrand: CmsAboutBrandSection,
  baseUrl: string,
): AboutBrandPresentation | null {
  const media = brand.media ?? fallbackBrand.media;
  const imageUrl = mediaUrl(
    baseUrl,
    media?.desktopImage ?? media?.mobileImage,
  );
  if (!imageUrl) return null;

  const fallbackMetrics = new Map(
    (fallbackBrand.metrics ?? []).map((metric) => [metric.order, metric]),
  );
  const metrics = [...(brand.metrics ?? fallbackBrand.metrics ?? [])]
    .sort((first, second) => first.order - second.order)
    .map((metric) => {
      const fallback = fallbackMetrics.get(metric.order) ?? metric;
      return {
        order: metric.order,
        value: `${metric.value}${metric.suffix ?? ''}`,
        label: metric.label?.trim() || undefined,
        description: metric.description || fallback.description,
      };
    });

  return {
    label: brand.label || fallbackBrand.label,
    imageUrl,
    mobileImageUrl:
      mediaUrl(baseUrl, media?.mobileImage) || imageUrl,
    imageAlt: media?.alt || brand.label || fallbackBrand.label,
    objectPosition: ingredientPosition(media),
    metrics,
    footerTitle: brand.footerTitle || fallbackBrand.footerTitle,
    footerDescription:
      brand.footerDescription || fallbackBrand.footerDescription,
  };
}

export function mapCmsAboutBrand(
  ptPage: CmsAboutPage | null | undefined,
  frPage: CmsAboutPage | null | undefined,
  baseUrl: string,
): LocalizedAboutBrandPresentation | null {
  const portugueseBrand = ptPage?.brand;
  if (!portugueseBrand) return null;

  const portuguese = mapAboutBrandTranslation(
    portugueseBrand,
    portugueseBrand,
    baseUrl,
  );
  const french = mapAboutBrandTranslation(
    frPage?.brand ?? portugueseBrand,
    portugueseBrand,
    baseUrl,
  );
  if (!portuguese || !french) return null;

  return { translations: { pt: portuguese, fr: french } };
}

function mapAboutPageTranslation(
  page: CmsAboutPage,
  fallbackPage: CmsAboutPage,
  baseUrl: string,
) {
  const heroMedia = page.heroMedia ?? fallbackPage.heroMedia;
  const heroImageUrl = mediaUrl(
    baseUrl,
    heroMedia?.desktopImage ?? heroMedia?.mobileImage,
  );
  const fallbackPillars = new Map(
    (fallbackPage.pillars?.items ?? []).map((item) => [item.order, item]),
  );
  const pillars = page.pillars ?? fallbackPage.pillars;
  const founder = page.founder ?? fallbackPage.founder;
  const fallbackFounderParagraphs = new Map(
    (fallbackPage.founder?.paragraphs ?? []).map((item) => [item.order, item]),
  );
  const founderMedia = founder?.media ?? fallbackPage.founder?.media;
  const founderImageUrl = mediaUrl(
    baseUrl,
    founderMedia?.desktopImage ?? founderMedia?.mobileImage,
  );
  const locations = page.locations ?? fallbackPage.locations;
  const fallbackLocations = new Map(
    (fallbackPage.locations?.items ?? []).map((item) => [item.order, item]),
  );
  const locationsMedia = locations?.media ?? fallbackPage.locations?.media;
  const locationsImageUrl = mediaUrl(
    baseUrl,
    locationsMedia?.desktopImage ?? locationsMedia?.mobileImage,
  );

  return {
    hero:
      heroImageUrl && (page.heroHeadline || fallbackPage.heroHeadline)
        ? {
            label: page.heroLabel || fallbackPage.heroLabel || '',
            headline: page.heroHeadline || fallbackPage.heroHeadline || '',
            description:
              page.heroDescription || fallbackPage.heroDescription || '',
            imageUrl: heroImageUrl,
            mobileImageUrl:
              mediaUrl(baseUrl, heroMedia?.mobileImage) || heroImageUrl,
            imageAlt:
              heroMedia?.alt ||
              page.heroHeadline ||
              fallbackPage.heroHeadline ||
              '',
            objectPosition: ingredientPosition(heroMedia),
          }
        : null,
    pillars: pillars
      ? {
          title: pillars.title || fallbackPage.pillars?.title || '',
          items: [...(pillars.items ?? fallbackPage.pillars?.items ?? [])]
            .sort((first, second) => first.order - second.order)
            .map((item) => {
              const fallback = fallbackPillars.get(item.order) ?? item;
              return {
                order: item.order,
                title: item.title || fallback.title,
                description: item.description || fallback.description || '',
              };
            }),
        }
      : null,
    founder:
      founder && founderImageUrl
        ? {
            label: founder.label || fallbackPage.founder?.label || '',
            name: founder.name || fallbackPage.founder?.name || '',
            paragraphs: [
              ...(founder.paragraphs ??
                fallbackPage.founder?.paragraphs ??
                []),
            ]
              .sort((first, second) => first.order - second.order)
              .map(
                (paragraph) =>
                  paragraph.text ||
                  fallbackFounderParagraphs.get(paragraph.order)?.text ||
                  '',
              )
              .filter(Boolean),
            ctaLabel:
              founder.ctaLabel || fallbackPage.founder?.ctaLabel || '',
            imageUrl: founderImageUrl,
            mobileImageUrl:
              mediaUrl(baseUrl, founderMedia?.mobileImage) || founderImageUrl,
            imageAlt:
              founderMedia?.alt ||
              founder.name ||
              fallbackPage.founder?.name ||
              '',
            objectPosition: ingredientPosition(founderMedia),
          }
        : null,
    locations:
      locations && locationsImageUrl
        ? {
            label: locations.label || fallbackPage.locations?.label || '',
            headline:
              locations.headline || fallbackPage.locations?.headline || '',
            description:
              locations.description ||
              fallbackPage.locations?.description ||
              '',
            items: [
              ...(locations.items ?? fallbackPage.locations?.items ?? []),
            ]
              .sort((first, second) => first.order - second.order)
              .map((item) => {
                const fallback = fallbackLocations.get(item.order) ?? item;
                return {
                  order: item.order,
                  title: item.title || fallback.title,
                  description: item.description || fallback.description,
                };
              }),
            imageUrl: locationsImageUrl,
            mobileImageUrl:
              mediaUrl(baseUrl, locationsMedia?.mobileImage) ||
              locationsImageUrl,
            imageAlt:
              locationsMedia?.alt ||
              locations.headline ||
              fallbackPage.locations?.headline ||
              '',
            objectPosition: ingredientPosition(locationsMedia),
          }
        : null,
  };
}

export function mapCmsAboutPage(
  ptPage: CmsAboutPage | null | undefined,
  frPage: CmsAboutPage | null | undefined,
  baseUrl: string,
): LocalizedAboutPagePresentation | null {
  if (!ptPage) return null;

  return {
    translations: {
      pt: mapAboutPageTranslation(ptPage, ptPage, baseUrl),
      fr: mapAboutPageTranslation(frPage ?? ptPage, ptPage, baseUrl),
    },
  };
}

function socialPlatform(label: string, url: string): SiteSocialLink['id'] | null {
  const value = `${label} ${url}`.toLocaleLowerCase();
  if (value.includes('instagram')) return 'instagram';
  if (value.includes('facebook')) return 'facebook';
  if (value.includes('tiktok')) return 'tiktok';
  return null;
}

function mapSiteSettingTranslation(
  setting: CmsSiteSetting,
  fallback: CmsSiteSetting,
  baseUrl: string,
) {
  const fallbackLinks = new Map(
    (fallback.socialLinks ?? []).map((link) => [link.url, link]),
  );
  const socialLinks = (setting.socialLinks ?? fallback.socialLinks ?? [])
    .flatMap((link) => {
      const platform = socialPlatform(link.label, link.url);
      if (!platform) return [];
      return [
        {
          id: platform,
          label: link.label || fallbackLinks.get(link.url)?.label || platform,
          url: link.url,
        },
      ];
    });

  return {
    siteName: setting.siteName || fallback.siteName,
    newsletterHeadline:
      setting.newsletterHeadline || fallback.newsletterHeadline || '',
    footerBackgroundUrl:
      mediaUrl(baseUrl, setting.footerBackground ?? fallback.footerBackground) ||
      undefined,
    termsUrl: setting.termsUrl || fallback.termsUrl || undefined,
    privacyUrl: setting.privacyUrl || fallback.privacyUrl || undefined,
    socialLinks,
  };
}

export function mapCmsSiteSetting(
  ptSetting: CmsSiteSetting | null | undefined,
  frSetting: CmsSiteSetting | null | undefined,
  baseUrl: string,
): LocalizedSiteSettingPresentation | null {
  if (!ptSetting) return null;
  return {
    translations: {
      pt: mapSiteSettingTranslation(ptSetting, ptSetting, baseUrl),
      fr: mapSiteSettingTranslation(frSetting ?? ptSetting, ptSetting, baseUrl),
    },
  };
}

export function mapCmsCategories(
  ptCategories: CmsCategory[],
  frCategories: CmsCategory[],
): Category[] {
  const frenchByDocumentId = new Map(
    frCategories.map((category) => [category.documentId, category]),
  );

  return ptCategories.map((category) => ({
    id: category.documentId || String(category.id),
    name: category.name,
    slug: category.slug,
    translations: {
      pt: category.name,
      fr: frenchByDocumentId.get(category.documentId)?.name ?? category.name,
    },
  }));
}

export function mergeCmsCategories(
  cmsCategories: Category[],
  fallbackCategories: Category[],
): Category[] {
  const cmsSlugs = new Set(
    cmsCategories.map((category) => category.slug.toLocaleLowerCase()),
  );
  return [
    ...cmsCategories,
    ...fallbackCategories.filter(
      (category) => !cmsSlugs.has(category.slug.toLocaleLowerCase()),
    ),
  ];
}

export function mapCmsSizes(sizes: CmsSize[]): Size[] {
  return sizes.map((size) => ({
    id: size.documentId || String(size.id),
    value: size.value || size.label,
  }));
}
