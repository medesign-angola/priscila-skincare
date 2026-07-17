import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductFacade } from '@org/core';
import { IngredientsSectionComponent } from '@org/shared';
import { AboutHeroSection } from './sections/about-hero-section/about-hero-section';
import { AboutBrandSection } from './sections/about-brand-section/about-brand-section';
import { AboutPillarsSection } from './sections/about-pillars-section/about-pillars-section';
import { AboutFounderSection } from './sections/about-founder-section/about-founder-section';
import { AboutLocationsSection } from './sections/about-locations-section/about-locations-section';

@Component({selector:'app-about',imports:[AboutHeroSection,AboutBrandSection,AboutPillarsSection,AboutFounderSection,IngredientsSectionComponent,AboutLocationsSection],templateUrl:'./about.html',styleUrl:'./about.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class About { readonly ingredients = inject(ProductFacade).homeIngredients; }
