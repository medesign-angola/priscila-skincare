export interface HeroSlidePrice {
  AOA: number;
  EUR: number;
}

export interface HeroSlideAction {
  label: string;
  href: string;
  external: boolean;
  openInNewTab: boolean;
  price?: HeroSlidePrice;
}

export interface HeroSlideMedia {
  type: 'image' | 'video';
  url: string;
  mobileUrl?: string;
  placeholderUrl?: string;
  alt: string;
  objectFit: 'cover' | 'contain';
  objectPosition: string;
  hasNoise: boolean;
  presentation: 'cover' | 'split-right';
}

export interface HeroSlide {
  id: string;
  name: string;
  label: string;
  headline: string;
  description?: string;
  order: number;
  media: HeroSlideMedia;
  action?: HeroSlideAction;
}
