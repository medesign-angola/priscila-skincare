import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ProductFacade } from '@org/core';

interface GalleryImageViewModel {
  index: string;
  url: string;
  alt: string;
}

interface EditorialGalleryViewModel {
  id: string;
  headline: string;
  description: string;
  coverImage: string;
  coverAlt: string;
  images: GalleryImageViewModel[];
}

@Component({
  selector: 'app-product-editorial-gallery-section',
  imports: [],
  templateUrl: './product-editorial-gallery-section.html',
  styleUrl: './product-editorial-gallery-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditorialGallerySection {
  private readonly facade = inject(ProductFacade);

  readonly gallery = computed<EditorialGalleryViewModel | null>(() => {
    const entry = this.facade.editorialGalleryProducts()[0];
    const language = this.facade.currentLanguage();
    const translation = entry?.product.translations[language];
    const editorial = translation?.galleryEditorial;

    if (!entry || !translation || !editorial) return null;

    const images = entry.placement.imageIndexes.flatMap((imageIndex, index) => {
      const url = entry.product.images[imageIndex];

      return url
        ? [
            {
              index: String(index + 1).padStart(2, '0'),
              url,
              alt: `${translation.name} — ${index + 1}`,
            },
          ]
        : [];
    });

    if (images.length !== 5) return null;

    return {
      id: entry.product.id,
      headline: editorial.headline,
      description: editorial.description,
      coverImage: entry.placement.coverImage,
      coverAlt: translation.name,
      images,
    };
  });
}
