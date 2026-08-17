export type CmsLocale = 'pt' | 'fr';

export interface CmsCollectionResponse<T> {
  data: T[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface CmsSingleResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
}

export interface CmsEntity {
  id: number;
  documentId: string;
  locale?: string;
}

export interface CmsMedia extends CmsEntity {
  name: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  mime: string;
  url: string;
}

export interface CmsMediaPresentation {
  desktopImage?: CmsMedia | null;
  mobileImage?: CmsMedia | null;
  video?: CmsMedia | null;
  placeholder?: CmsMedia | null;
  alt?: string | null;
  focalPointX?: number | string | null;
  focalPointY?: number | string | null;
  objectFit?: 'cover' | 'contain' | null;
  hasNoise?: boolean | null;
}

export interface CmsPrices {
  aoa: number | string;
  eur: number | string;
}

export interface CmsBadge {
  type: 'none' | 'discount' | 'new' | 'coming-soon';
  percentage?: number | null;
}

export interface CmsCommerce {
  prices: CmsPrices;
  availability: 'in-stock' | 'coming-soon' | 'out-of-stock';
  stock?: number | null;
  badge?: CmsBadge | null;
}

export interface CmsActionTarget extends CmsEntity {
  name: string;
  slug: string;
  commerce?: CmsCommerce | null;
  prices?: CmsPrices | null;
}

export type CmsHeroAction =
  | {
      __component: 'action.product';
      label: string;
      product?: CmsActionTarget | null;
    }
  | {
      __component: 'action.kit';
      label: string;
      kit?: CmsActionTarget | null;
    }
  | {
      __component: 'action.collection';
      label: string;
      collection?: CmsActionTarget | null;
    }
  | {
      __component: 'action.category';
      label: string;
      category?: CmsActionTarget | null;
    }
  | {
      __component: 'action.internal-page';
      label: string;
      page: 'produtos' | 'sobre' | 'perfil' | 'encomendas';
    }
  | {
      __component: 'action.external-link';
      label: string;
      url: string;
      openInNewTab?: boolean | null;
    };

export interface CmsHeroSlide extends CmsEntity {
  name: string;
  label: string;
  headline: string;
  description?: string | null;
  presentation?: 'split-right' | 'cover';
  media: CmsMediaPresentation;
  cta?: CmsHeroAction[] | null;
  order: number;
}

export interface CmsCategory extends CmsEntity {
  name: string;
  slug: string;
  description?: string | null;
}

export interface CmsSize extends CmsEntity {
  label: string;
  value: string;
  order: number;
}

export interface CmsIngredient extends CmsEntity {
  name: string;
  slug: string;
  description: string;
  thumbnailImage?: CmsMedia | null;
  editorialMedia?: CmsMediaPresentation | null;
}

export interface CmsIngredientsPresentation {
  id?: number;
  headline: string;
  description: string;
  footnote: string;
  ingredients?: CmsIngredient[] | null;
}

export interface CmsTextItem {
  order: number;
  title: string;
  description?: string | null;
}

export interface CmsBenefit {
  order: number;
  title: string;
  description: string;
  images?: CmsMedia[] | null;
}

export interface CmsEditorialCopy {
  headline: string;
  description: string;
  footnote?: string | null;
}

export interface CmsUsageStep {
  order: number;
  name: string;
  description: string;
}

export interface CmsResultStat {
  percentage: number;
  description: string;
}

export interface CmsBeforeAfter {
  before?: CmsMedia | null;
  after?: CmsMedia | null;
  beforeLabel?: string | null;
  afterLabel?: string | null;
}

export interface CmsResults {
  description?: string | null;
  statistics?: CmsResultStat[] | null;
  comparison?: CmsBeforeAfter | null;
}

export interface CmsReview extends CmsEntity {
  name: string;
  title?: string | null;
  comment: string;
  rating: number;
  recommends?: boolean | null;
  moderationStatus?: 'pending' | 'published' | 'rejected' | null;
  reviewDate?: string | null;
  createdAt?: string;
}

export interface CmsProduct extends CmsEntity {
  name: string;
  slug: string;
  description: string;
  additionalDescription?: string | null;
  sku: string;
  commerce: CmsCommerce;
  images?: CmsMedia[] | null;
  thumbnailImage?: CmsMedia | null;
  featuredImage?: CmsMedia | null;
  category?: CmsCategory | null;
  sizes?: CmsSize[] | null;
  ingredients?: CmsIngredient[] | null;
  highlights?: CmsTextItem[] | null;
  benefits?: CmsBenefit[] | null;
  benefitsMainMedia?: CmsMediaPresentation | null;
  editorial?: CmsEditorialCopy | null;
  galleryEditorial?: CmsEditorialCopy | null;
  usageSteps?: CmsUsageStep[] | null;
  usageMedia?: CmsMediaPresentation | null;
  results?: CmsResults | null;
  reviews?: CmsReview[] | null;
}

export interface CmsKitProductReference extends CmsEntity {
  name: string;
  slug: string;
}

export interface CmsBundleDetails {
  images?: CmsMedia[] | null;
  usageSteps?: CmsUsageStep[] | null;
  usageMedia?: CmsMediaPresentation | null;
  results?: CmsResults | null;
}

export interface CmsKitHomePresentation {
  id?: number;
  order: number;
  editorialTitle?: string | null;
  editorialDescription?: string | null;
  editorialFootnote?: string | null;
  finderDescription?: string | null;
}

export interface CmsKit extends CmsEntity {
  name: string;
  slug: string;
  description: string;
  commerce?: CmsCommerce | null;
  prices?: CmsPrices | null;
  thumbnailImage?: CmsMedia | null;
  media?: CmsMediaPresentation | null;
  homePresentation?: CmsKitHomePresentation | null;
  products?: CmsKitProductReference[] | null;
  details?: CmsBundleDetails | null;
  relatedProducts?: CmsKitProductReference[] | null;
}

export interface CmsCollectionHomePresentation {
  id?: number;
  order: number;
  title?: string | null;
  description?: string | null;
  footnote?: string | null;
}

export interface CmsProductCollection extends CmsEntity {
  name: string;
  slug: string;
  description: string;
  prices?: CmsPrices | null;
  thumbnailImage?: CmsMedia | null;
  media?: CmsMediaPresentation | null;
  homePresentation?: CmsCollectionHomePresentation | null;
  products?: CmsKitProductReference[] | null;
  details?: CmsBundleDetails | null;
  relatedProducts?: CmsKitProductReference[] | null;
}

export interface CmsFeaturedProductSlot {
  id: number;
  order: number;
  product?: CmsKitProductReference | null;
}

export interface CmsHomeEditorialCover {
  id?: number;
  product?: CmsKitProductReference | null;
  media?: CmsMediaPresentation | null;
}

export interface CmsHomeEditorialGallery {
  id?: number;
  product?: CmsKitProductReference | null;
}

export interface CmsTestimonial extends CmsEntity {
  name: string;
  message?: string | null;
  rating?: number | null;
  video?: CmsMedia | null;
  poster?: CmsMedia | null;
  order: number;
}

export interface CmsTestimonialsPresentation {
  id?: number;
  title: string;
  description: string;
  testimonials?: CmsTestimonial[] | null;
}

export interface CmsHomePage extends CmsEntity {
  featuredProducts?: CmsFeaturedProductSlot[] | null;
  editorialCover?: CmsHomeEditorialCover | null;
  editorialGallery?: CmsHomeEditorialGallery | null;
  featuredKit?: CmsKitProductReference | null;
  featuredCollection?: CmsKitProductReference | null;
  ingredients?: CmsIngredientsPresentation | null;
  testimonials?: CmsTestimonialsPresentation | null;
  brandPillars?: CmsAboutPillarsSection | null;
}

export interface CmsAboutBrandMetric {
  id?: number;
  order: number;
  value: number;
  suffix?: string | null;
  label?: string | null;
  description: string;
}

export interface CmsAboutBrandSection {
  id?: number;
  label: string;
  media?: CmsMediaPresentation | null;
  metrics?: CmsAboutBrandMetric[] | null;
  footerTitle: string;
  footerDescription: string;
}

export interface CmsAboutPillarsSection {
  id?: number;
  title: string;
  items?: CmsTextItem[] | null;
}

export interface CmsAboutParagraph {
  id?: number;
  order: number;
  text: string;
}

export interface CmsAboutFounderSection {
  id?: number;
  label: string;
  name: string;
  paragraphs?: CmsAboutParagraph[] | null;
  media?: CmsMediaPresentation | null;
  ctaLabel: string;
}

export interface CmsAboutLocation {
  id?: number;
  order: number;
  title: string;
  description: string;
}

export interface CmsAboutLocationsSection {
  id?: number;
  label: string;
  headline: string;
  description: string;
  items?: CmsAboutLocation[] | null;
  media?: CmsMediaPresentation | null;
}

export interface CmsAboutPage extends CmsEntity {
  heroLabel?: string | null;
  heroHeadline?: string | null;
  heroDescription?: string | null;
  heroMedia?: CmsMediaPresentation | null;
  brand?: CmsAboutBrandSection | null;
  pillars?: CmsAboutPillarsSection | null;
  founder?: CmsAboutFounderSection | null;
  locations?: CmsAboutLocationsSection | null;
  ingredients?: CmsIngredientsPresentation | null;
}

export interface CmsLink {
  id?: number;
  label: string;
  url: string;
  openInNewTab?: boolean | null;
}

export interface CmsSiteSetting extends CmsEntity {
  siteName: string;
  contactEmail?: string | null;
  socialLinks?: CmsLink[] | null;
  newsletterHeadline?: string | null;
  footerBackground?: CmsMedia | null;
  termsUrl?: string | null;
  privacyUrl?: string | null;
  defaultCurrency?: 'AOA' | 'EUR' | null;
  logo?: CmsMedia | null;
}
