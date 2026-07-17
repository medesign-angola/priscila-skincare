import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ProductFacade } from '@org/core';
import { HeroCoverComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-featured-collection-section',
  imports: [HeroCoverComponent, TranslatePipe],
  templateUrl: './featured-collection-section.html',
  styleUrl: './featured-collection-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedCollectionSection {
  private readonly facade = inject(ProductFacade);

  readonly collection = computed(
    () => this.facade.homeCollectionsWithProducts()[0] ?? null,
  );

  exploreCollection(slug: string): void {
    console.log('Abrir coleção:', slug);
  }
}
