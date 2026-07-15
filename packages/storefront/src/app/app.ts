import {
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from '@org/shared';
import { ProductFacade, HeaderService } from '@org/core';

@Component({
  imports: [RouterModule, HeaderComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly facade = inject(ProductFacade);
  readonly headerService = inject(HeaderService);
  private readonly translateService = inject(TranslateService);
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
}
