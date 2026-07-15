import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductFacade } from '@org/core';
import { HeroSplitComponent, HeroCoverComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSplitComponent,
    HeroCoverComponent,
    TranslatePipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  readonly facade = inject(ProductFacade);
  readonly brandPillars = [
    {
      titleKey: 'HOME.BRAND_PILLARS.ACTIVE_FORMULAS.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.ACTIVE_FORMULAS.DESCRIPTION',
    },
    {
      titleKey: 'HOME.BRAND_PILLARS.SENSITIVE_SKIN.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.SENSITIVE_SKIN.DESCRIPTION',
    },
    {
      titleKey: 'HOME.BRAND_PILLARS.MADE_IN_FRANCE.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.MADE_IN_FRANCE.DESCRIPTION',
    },
    {
      titleKey: 'HOME.BRAND_PILLARS.SAFETY_CERTIFIED.TITLE',
      descriptionKey: 'HOME.BRAND_PILLARS.SAFETY_CERTIFIED.DESCRIPTION',
    },
  ] as const;

  onBuy(productId: string) {
    console.log('Comprar produto:', productId);
  }
}
