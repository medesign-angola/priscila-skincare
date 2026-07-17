import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-brand-pillars-section',
  imports: [TranslatePipe],
  templateUrl: './brand-pillars-section.html',
  styleUrl: './brand-pillars-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandPillarsSection {
  readonly pillars = [
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
}
