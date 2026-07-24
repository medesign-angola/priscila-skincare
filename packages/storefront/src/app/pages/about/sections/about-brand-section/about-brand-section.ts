import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CountUpDirective } from '@org/shared';
@Component({selector:'app-about-brand-section',imports:[TranslatePipe,CountUpDirective],templateUrl:'./about-brand-section.html',styleUrl:'./about-brand-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutBrandSection { readonly metrics=[{value:'2020',labelKey:'ABOUT.BRAND.FOUNDATION_LABEL',descriptionKey:'ABOUT.BRAND.FOUNDATION_DESCRIPTION'},{value:'73+',labelKey:'ABOUT.BRAND.PRODUCTS_LABEL',descriptionKey:'ABOUT.BRAND.PRODUCTS_DESCRIPTION'},{value:'5K+',labelKey:'ABOUT.BRAND.CLIENTS_LABEL',descriptionKey:'ABOUT.BRAND.CLIENTS_DESCRIPTION'}]; }
