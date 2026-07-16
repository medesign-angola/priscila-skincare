import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { HeaderService, ProductFacade } from '@org/core';
import { formatPrice, ProductCard, ProductCardData } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
import {
  HOME_PRODUCTS_CATALOG_CONFIG,
  normalizeCatalogConfig,
} from './products-catalog.config';

interface Killable {
  kill(): void;
}

interface Revertible {
  revert(): void;
}

@Component({
  selector: 'app-products-catalog-section',
  imports: [ProductCard, TranslatePipe],
  templateUrl: './products-catalog-section.html',
  styleUrl: './products-catalog-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsCatalogSection {
  private readonly facade = inject(ProductFacade);
  private readonly headerService = inject(HeaderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly config = normalizeCatalogConfig(
    inject(HOME_PRODUCTS_CATALOG_CONFIG),
  );

  private readonly catalogRoot =
    viewChild<ElementRef<HTMLElement>>('catalogRoot');
  private readonly loadSentinel =
    viewChild<ElementRef<HTMLElement>>('loadSentinel');

  private gsap: (typeof import('gsap'))['gsap'] | null = null;
  private ScrollTrigger:
    (typeof import('gsap/ScrollTrigger'))['ScrollTrigger'] | null = null;
  private loadTrigger: Killable | null = null;
  private mobileMediaQuery: MediaQueryList | null = null;
  private readonly motionContexts: Revertible[] = [];
  private renderTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  readonly visibleLimit = signal(this.config.initialLimit);
  readonly isMobile = signal(false);

  readonly catalogProducts = computed<ProductCardData[]>(() => {
    const language = this.facade.currentLanguage();
    const currency = this.headerService.currency();
    const categories = this.facade.mappedCategories();

    return this.facade
      .products()
      .slice(0, this.config.maxProducts)
      .flatMap((product) => {
        const commerce = product.commerce;
        if (!commerce) return [];

        const translation = product.translations[language];
        const category = categories.get(product.categoryId);

        return [
          {
            id: product.id,
            name: translation.name,
            description: translation.description,
            categoryLabel: category?.translations?.[language] ?? category?.name,
            imageUrl: product.images[0] ?? product.thumbnailImage,
            rating: translation.reviews.averageRating,
            totalReviews: translation.reviews.totalReviews,
            currencyLabel: currency === 'AOA' ? 'Kz' : '€',
            priceLabel: formatPrice(
              commerce.prices[currency],
              currency,
              language,
              false,
            ),
            available: commerce.availability === 'in-stock',
            badge: commerce.badge,
          },
        ];
      });
  });

  readonly visibleProducts = computed(() =>
    this.catalogProducts().slice(0, this.visibleLimit()),
  );

  readonly hasMoreProducts = computed(
    () => this.visibleProducts().length < this.catalogProducts().length,
  );

  readonly canShowViewMore = computed(
    () =>
      this.catalogProducts().length >= this.config.maxProducts &&
      this.visibleProducts().length >= this.config.maxProducts,
  );

  constructor() {
    afterNextRender(() => {
      this.initializeResponsiveMode();
      void this.initializeMotion();
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.loadTrigger?.kill();
      this.motionContexts.forEach((context) => context.revert());
      if (this.renderTimeout) clearTimeout(this.renderTimeout);
      this.mobileMediaQuery?.removeEventListener(
        'change',
        this.handleResponsiveChange,
      );
    });
  }

  selectProduct(productId: string): void {
    console.log('Abrir produto:', productId);
  }

  addToCart(productId: string): void {
    console.log('Adicionar ao carrinho:', productId);
  }

  loadNextBatch(): void {
    if (!this.hasMoreProducts()) return;

    const availableLimit = Math.min(
      this.catalogProducts().length,
      this.config.maxProducts,
    );

    this.visibleLimit.update((currentLimit) =>
      Math.min(
        currentLimit +
          (this.isMobile()
            ? this.config.mobileBatchSize
            : this.config.batchSize),
        availableLimit,
      ),
    );

    this.loadTrigger?.kill();
    this.loadTrigger = null;
    if (this.renderTimeout) clearTimeout(this.renderTimeout);

    this.renderTimeout = setTimeout(() => {
      if (this.destroyed) return;
      this.animateNewCards();
      this.ScrollTrigger?.refresh();
      if (!this.isMobile()) this.createLoadTrigger();
    });
  }

  private readonly handleResponsiveChange = (event: MediaQueryListEvent) => {
    this.applyResponsiveMode(event.matches);
  };

  private initializeResponsiveMode(): void {
    this.mobileMediaQuery = matchMedia('(max-width: 600px)');
    this.mobileMediaQuery.addEventListener(
      'change',
      this.handleResponsiveChange,
    );
    this.applyResponsiveMode(this.mobileMediaQuery.matches);
  }

  private applyResponsiveMode(isMobile: boolean): void {
    this.isMobile.set(isMobile);
    this.loadTrigger?.kill();
    this.loadTrigger = null;

    if (isMobile) {
      this.visibleLimit.set(
        Math.min(this.config.mobileInitialLimit, this.config.maxProducts),
      );
      return;
    }

    this.visibleLimit.set(
      Math.max(this.visibleLimit(), this.config.initialLimit),
    );
    this.createLoadTrigger();
  }

  private async initializeMotion(): Promise<void> {
    if (!this.isBrowser || this.destroyed) return;

    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);

    if (this.destroyed) return;

    gsap.registerPlugin(ScrollTrigger);
    this.gsap = gsap;
    this.ScrollTrigger = ScrollTrigger;
    this.animateNewCards();
    this.createLoadTrigger();
  }

  private animateNewCards(): void {
    const gsap = this.gsap;
    const root = this.catalogRoot()?.nativeElement;
    if (!gsap || !root) return;

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>(
        '[data-catalog-card]:not([data-motion-complete])',
      ),
    );
    if (cards.length === 0) return;

    cards.forEach((card) => card.setAttribute('data-motion-complete', ''));

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        cards,
        {
          autoAlpha: 0,
          y: 40,
          scale: 0.985,
          willChange: 'transform, opacity',
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: 'power3.out',
          stagger: 0.08,
          clearProps: 'transform,opacity,visibility,willChange',
        },
      );
    }, root);

    this.motionContexts.push(context);
  }

  private createLoadTrigger(): void {
    const ScrollTrigger = this.ScrollTrigger;
    const sentinel = this.loadSentinel()?.nativeElement;
    if (
      !ScrollTrigger ||
      !sentinel ||
      !this.hasMoreProducts() ||
      this.isMobile()
    )
      return;

    this.loadTrigger?.kill();
    this.loadTrigger = ScrollTrigger.create({
      trigger: sentinel,
      start: 'top 90%',
      once: true,
      onEnter: () => this.loadNextBatch(),
    });
  }
}
