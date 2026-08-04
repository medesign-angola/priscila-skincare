export interface AboutBrandMetric {
  order: number;
  value: string;
  label?: string;
  description: string;
}

export interface AboutBrandPresentation {
  label: string;
  imageUrl: string;
  mobileImageUrl?: string;
  imageAlt: string;
  objectPosition: string;
  metrics: AboutBrandMetric[];
  footerTitle: string;
  footerDescription: string;
}

export interface LocalizedAboutBrandPresentation {
  translations: Record<'pt' | 'fr', AboutBrandPresentation>;
}

export interface AboutMediaPresentation {
  imageUrl: string;
  mobileImageUrl?: string;
  imageAlt: string;
  objectPosition: string;
}

export interface AboutHeroPresentation extends AboutMediaPresentation {
  label: string;
  headline: string;
  description: string;
}

export interface AboutPillarPresentation {
  order: number;
  title: string;
  description: string;
}

export interface AboutPillarsPresentation {
  title: string;
  items: AboutPillarPresentation[];
}

export interface AboutFounderPresentation extends AboutMediaPresentation {
  label: string;
  name: string;
  paragraphs: string[];
  ctaLabel: string;
}

export interface AboutLocationPresentation {
  order: number;
  title: string;
  description: string;
}

export interface AboutLocationsPresentation extends AboutMediaPresentation {
  label: string;
  headline: string;
  description: string;
  items: AboutLocationPresentation[];
}

export interface AboutPagePresentation {
  hero: AboutHeroPresentation | null;
  pillars: AboutPillarsPresentation | null;
  founder: AboutFounderPresentation | null;
  locations: AboutLocationsPresentation | null;
}

export interface LocalizedAboutPagePresentation {
  translations: Record<'pt' | 'fr', AboutPagePresentation>;
}
