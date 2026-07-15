export interface Kit {
  id: string;
  name: string;
  collection: string; // Subtitle/Collection name
  description: string; // Kit description/tagline até 45 caracteres
  price: number;
  currency: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaStyle: 'split-right' | 'cover';
  placeholderUrl?: string; // Stretched low-res blurred loading placeholder
  productIds: string[]; // referenced products
  featured: boolean; // featured on homepage hero slider
}
