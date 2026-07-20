import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({selector:'app-about-pillars-section',imports:[TranslatePipe],templateUrl:'./about-pillars-section.html',styleUrl:'./about-pillars-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutPillarsSection {
  readonly pillars = [
    { index: '01', titleKey: 'ABOUT.PILLARS.ACTIVE_FORMULAS.TITLE', descriptionKey: 'ABOUT.PILLARS.ACTIVE_FORMULAS.DESCRIPTION' },
    { index: '02', titleKey: 'ABOUT.PILLARS.SENSITIVE_SKIN.TITLE', descriptionKey: 'ABOUT.PILLARS.SENSITIVE_SKIN.DESCRIPTION' },
    { index: '03', titleKey: 'ABOUT.PILLARS.SAFETY.TITLE', descriptionKey: 'ABOUT.PILLARS.SAFETY.DESCRIPTION' },
  ];
}
