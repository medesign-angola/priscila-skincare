import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProductFacade } from '@org/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
@Component({selector:'app-about-founder-section',imports:[RouterLink,TranslatePipe],templateUrl:'./about-founder-section.html',styleUrl:'./about-founder-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutFounderSection {
  private readonly facade = inject(ProductFacade);
  readonly content = computed(() => this.facade.aboutPage()?.founder ?? null);
}
