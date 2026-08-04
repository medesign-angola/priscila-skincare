export interface SiteSocialLink {
  id: 'instagram' | 'facebook' | 'tiktok';
  label: string;
  url: string;
}

export interface SiteSettingPresentation {
  siteName: string;
  newsletterHeadline: string;
  footerBackgroundUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  socialLinks: SiteSocialLink[];
}

export interface LocalizedSiteSettingPresentation {
  translations: Record<'pt' | 'fr', SiteSettingPresentation>;
}
