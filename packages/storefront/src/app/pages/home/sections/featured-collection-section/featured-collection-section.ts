import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ProductFacade } from '@org/core';
import { HeroCoverComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-featured-collection-section',
  imports: [HeroCoverComponent, TranslatePipe],
  templateUrl: './featured-collection-section.html',
  styleUrl: './featured-collection-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedCollectionSection {
  private readonly facade = inject(ProductFacade);
  private readonly router = inject(Router);

  readonly collection = computed(
    () => this.facade.featuredHomeCollectionWithProducts(),
  );

  exploreCollection(slug: string): void {
    void this.router.navigate(['/produtos', 'colecao', slug]);
  }
}
