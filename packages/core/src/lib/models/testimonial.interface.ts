export interface VideoTestimonial {
  id: string;
  authorLabel: string;
  videoUrl: string;
  posterUrl?: string;
  order: number;
}

export interface HomeTestimonialsTranslation {
  title: string;
  description: string;
}

export interface HomeTestimonialsPresentation {
  translations: Record<'pt' | 'fr', HomeTestimonialsTranslation>;
  testimonials: VideoTestimonial[];
}

export interface ReviewsSummary {
  averageRating: number;
  totalReviews: number;
}
