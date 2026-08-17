import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { KitWithProducts, ProductFacade } from '@org/core';
import { HeroCoverComponent, HeroSplitComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

interface HomeKitViewModel {
  id: string;
  slug?: string;
  index: string;
  title: string;
  editorialDescription: string;
  editorialFootnote: string;
  finderDescription: string;
  thumbnailImage: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaStyle: 'split-right' | 'cover';
  placeholderUrl?: string;
  productCount: number;
}

@Component({
  selector: 'app-kits-section',
  imports: [HeroCoverComponent, HeroSplitComponent, TranslatePipe],
  templateUrl: './kits-section.html',
  styleUrl: './kits-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitsSection {
  private readonly facade = inject(ProductFacade);
  private readonly router = inject(Router);

  readonly kits = computed<HomeKitViewModel[]>(() => {
    const language = this.facade.currentLanguage();

    return this.facade
      .homeKitsWithProducts()
      .map((kit, index) => this.toViewModel(kit, language, index));
  });

  readonly editorialKit = computed(() => {
    const kit = this.facade.featuredHomeKitWithProducts();
    if (!kit) return null;

    return this.toViewModel(
      kit,
      this.facade.currentLanguage(),
      0,
    );
  });

  viewProducts(identifier: string): void {
    void this.router.navigate(['/kits', identifier]);
  }

  private toViewModel(
    kit: KitWithProducts,
    language: 'pt' | 'fr',
    index: number,
  ): HomeKitViewModel {
    const baseTranslation = kit.translations[language];
    const homeTranslation = kit.home?.translations[language];

    return {
      id: kit.id,
      slug: kit.slug,
      index: String(index + 1).padStart(2, '0'),
      title: homeTranslation?.editorialTitle || baseTranslation.name,
      editorialDescription:
        homeTranslation?.editorialDescription ||
        baseTranslation.description,
      editorialFootnote: homeTranslation?.editorialFootnote || '',
      finderDescription:
        homeTranslation?.finderDescription ||
        baseTranslation.description ||
        baseTranslation.name,
      thumbnailImage:
        kit.home?.thumbnailImage ||
        kit.thumbnailImage ||
        kit.mediaUrl,
      mediaType: kit.home?.mediaType ?? kit.mediaType,
      mediaUrl: kit.home?.mediaUrl || kit.mediaUrl,
      mediaStyle: kit.home?.mediaStyle ?? 'split-right',
      placeholderUrl: kit.home?.placeholderUrl ?? kit.placeholderUrl,
      productCount: kit.products.length,
    };
  }
}
