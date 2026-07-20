import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
@Component({selector:'app-about-locations-section',imports:[TranslatePipe],templateUrl:'./about-locations-section.html',styleUrl:'./about-locations-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutLocationsSection { readonly locations=[{titleKey:'ABOUT.CONTACT.LUANDA_TITLE',descriptionKey:'ABOUT.CONTACT.LUANDA_DESCRIPTION'},{titleKey:'ABOUT.CONTACT.ONLINE_TITLE',descriptionKey:'ABOUT.CONTACT.ONLINE_DESCRIPTION'},{titleKey:'ABOUT.CONTACT.INTERNATIONAL_TITLE',descriptionKey:'ABOUT.CONTACT.INTERNATIONAL_DESCRIPTION'}]; }
