import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProductFacade } from '@org/core';
import { HeroCoverComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
@Component({selector:'app-about-hero-section',imports:[HeroCoverComponent,TranslatePipe],templateUrl:'./about-hero-section.html',styleUrl:'./about-hero-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutHeroSection {
  private readonly facade = inject(ProductFacade);
  readonly content = computed(() => this.facade.aboutPage()?.hero ?? null);
}
