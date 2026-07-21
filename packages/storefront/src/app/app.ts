import {
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
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
  private readonly documentTitle = inject(Title);
  private readonly router = inject(Router);
  readonly shellMode = signal<'storefront' | 'auth' | 'account'>('storefront');
  readonly showFooter = computed(() => this.shellMode() === 'storefront');
  readonly headerProducts = computed(() => {
    const language = this.facade.currentLanguage();

    return this.facade.products().map((product) => ({
      id: product.id,
      name: product.translations[language].name,
      image: product.thumbnailImage,
    }));
  });
  readonly headerCollections = computed(() =>
    this.facade.localizedCollectionsWithProducts().map((collection) => ({
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
    this.facade.localizedCollectionsWithProducts().map((collection, index) => ({
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
    this.updateShellMode(this.router.url);
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => this.updateShellMode(event.urlAfterRedirects));
    effect(() => {
      this.translateService.use(this.facade.currentLanguage()).subscribe(() => {
        this.documentTitle.setTitle(this.translateService.instant('GLOBAL.TITLE'));
      });
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

  private updateShellMode(url: string): void {
    if (url.startsWith('/entrar') || url.startsWith('/verificar-codigo')) {
      this.shellMode.set('auth');
    } else if (url.startsWith('/conta')) {
      this.shellMode.set('account');
    } else {
      this.shellMode.set('storefront');
    }
  }

  handleFooterNavigation(selection: {
    type: 'product' | 'collection';
    id: string;
  }): void {
    if (selection.type === 'product') {
      void this.router.navigate(['/produtos', selection.id]);
      return;
    }

    void this.router.navigate(['/produtos', 'colecao', selection.id]);
  }

  handleNewsletterSubmit(email: string): void {
    void email;
  }
}
