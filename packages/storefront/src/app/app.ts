import {
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  FooterComponent,
  FooterSocialLink,
  HeaderComponent,
} from '@org/shared';
import { ProductFacade, HeaderService } from '@org/core';

@Component({
  imports: [RouterModule, HeaderComponent, FooterComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly facade = inject(ProductFacade);
  readonly headerService = inject(HeaderService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);
  readonly headerProducts = computed(() => {
    const language = this.facade.currentLanguage();

    return this.facade.products().map((product) => ({
      id: product.id,
      name: product.translations[language].name,
      image: product.thumbnailImage,
    }));
  });
  readonly headerCollections = computed(() =>
    this.facade.collectionsWithProducts().map((collection) => ({
      id: collection.id,
      name: collection.name,
      image: collection.thumbnailImage,
    })),
  );
  readonly footerProducts = computed(() => {
    const language = this.facade.currentLanguage();

    return this.facade.products().map((product, index) => ({
      id: product.id,
      index: String(index + 1).padStart(2, '0'),
      label: product.translations[language].name,
      imageUrl: product.thumbnailImage,
    }));
  });
  readonly footerCollections = computed(() =>
    this.facade.collectionsWithProducts().map((collection, index) => ({
      id: collection.id,
      index: String(index + 1).padStart(2, '0'),
      label: collection.name,
      imageUrl: collection.thumbnailImage,
    })),
  );
  readonly footerSocialLinks: readonly FooterSocialLink[] = [
    { id: 'instagram', index: '01', label: 'Instagram' },
    { id: 'facebook', index: '02', label: 'Facebook' },
    { id: 'tiktok', index: '03', label: 'TikTok' },
  ];

  constructor() {
    effect(() => {
      this.translateService.use(this.facade.currentLanguage());
    });

    afterNextRender(async () => {
      const { default: Lenis } = await import('lenis');
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis();

      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    });
  }

  handleFooterNavigation(selection: {
    type: 'product' | 'collection';
    id: string;
  }): void {
    if (selection.type === 'product') {
      void this.router.navigate(['/produtos', selection.id]);
    }
  }

  handleNewsletterSubmit(email: string): void {
    void email;
  }
}
