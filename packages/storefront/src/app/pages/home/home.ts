import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroSection } from './sections/hero-section/hero-section';
import { BrandPillarsSection } from './sections/brand-pillars-section/brand-pillars-section';
import { FeaturedProductsSection } from './sections/featured-products-section/featured-products-section';
import { KitsSection } from './sections/kits-section/kits-section';
import { FeaturedProductEditorialSection } from './sections/featured-product-editorial-section/featured-product-editorial-section';
import { ProductEditorialGallerySection } from './sections/product-editorial-gallery-section/product-editorial-gallery-section';
import { IngredientsSection } from './sections/ingredients-section/ingredients-section';
import { ProductsCatalogSection } from './sections/products-catalog-section/products-catalog-section';
import { FeaturedCollectionSection } from './sections/featured-collection-section/featured-collection-section';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSection,
    BrandPillarsSection,
    FeaturedProductsSection,
    KitsSection,
    FeaturedProductEditorialSection,
    ProductEditorialGallerySection,
    IngredientsSection,
    ProductsCatalogSection,
    FeaturedCollectionSection,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
