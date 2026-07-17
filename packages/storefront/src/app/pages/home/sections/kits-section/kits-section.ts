import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { KitWithProducts, ProductFacade } from '@org/core';
import { HeroCoverComponent, HeroSplitComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

interface HomeKitViewModel {
  id: string;
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

  readonly kits = computed<HomeKitViewModel[]>(() => {
    const language = this.facade.currentLanguage();

    return this.facade
      .homeKitsWithProducts()
      .flatMap((kit, index) => this.toViewModel(kit, language, index));
  });

  readonly editorialKit = computed(() => this.kits()[0] ?? null);

  viewProducts(kitId: string): void {
    console.log('Ver produtos do kit:', kitId);
  }

  private toViewModel(
    kit: KitWithProducts,
    language: 'pt' | 'fr',
    index: number,
  ): HomeKitViewModel[] {
    if (!kit.home) return [];

    const translation = kit.home.translations[language];

    return [
      {
        id: kit.id,
        index: String(index + 1).padStart(2, '0'),
        title: translation.editorialTitle,
        editorialDescription: translation.editorialDescription,
        editorialFootnote: translation.editorialFootnote,
        finderDescription: translation.finderDescription,
        thumbnailImage: kit.home.thumbnailImage,
        mediaType: kit.home.mediaType,
        mediaUrl: kit.home.mediaUrl,
        mediaStyle: kit.home.mediaStyle,
        placeholderUrl: kit.home.placeholderUrl,
        productCount: kit.products.length,
      },
    ];
  }
}
