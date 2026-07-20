import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroCoverComponent } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
@Component({selector:'app-about-hero-section',imports:[HeroCoverComponent,TranslatePipe],templateUrl:'./about-hero-section.html',styleUrl:'./about-hero-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutHeroSection {}
