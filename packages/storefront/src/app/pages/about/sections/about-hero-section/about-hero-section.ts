import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroCoverComponent } from '@org/shared';
@Component({selector:'app-about-hero-section',imports:[HeroCoverComponent],templateUrl:'./about-hero-section.html',styleUrl:'./about-hero-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutHeroSection {}
