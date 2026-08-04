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
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartFacade, HeaderService, Product, ProductFacade } from '@org/core';
import { formatPrice, ProductCard, ProductCardData } from '@org/shared';
import { combineLatest, map } from 'rxjs';
import { ShippingInformationSection } from '../product-details/sections/shipping-information-section/shipping-information-section';
import { TranslatePipe } from '@ngx-translate/core';

type CatalogContext = 'all' | 'collection' | 'category' | 'kit';
type CatalogSort = 'default' | 'name-asc' | 'price-asc' | 'price-desc';

interface CatalogViewModel {
  context: CatalogContext;
  title: string;
  titleIsKey?: boolean;
  parentLabel?: string;
  parentLabelIsKey?: boolean;
  products: Product[];
  found: boolean;
}

const DESKTOP_INITIAL_PRODUCT_LIMIT = 9;
const DESKTOP_PRODUCT_BATCH_SIZE = 9;
const MOBILE_INITIAL_PRODUCT_LIMIT = 3;
const MOBILE_PRODUCT_BATCH_SIZE = 3;

@Component({
  selector: 'app-products',
  imports: [RouterLink, ProductCard, ShippingInformationSection, TranslatePipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(ProductFacade);
  private readonly cart = inject(CartFacade);
  private readonly header = inject(HeaderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly loadSentinel = viewChild<ElementRef<HTMLElement>>('loadSentinel');
  private observer: IntersectionObserver | null = null;
  private mobileMediaQuery: MediaQueryList | null = null;

  private readonly routeState = toSignal(
    combineLatest([this.route.data, this.route.paramMap]).pipe(
      map(([data, params]) => ({
        context: (data['catalogContext'] ?? 'all') as CatalogContext,
        identifier: params.get('contextId'),
      })),
    ),
    { initialValue: { context: 'all' as CatalogContext, identifier: null } },
  );

  readonly visibleLimit = signal(DESKTOP_INITIAL_PRODUCT_LIMIT);
  readonly isMobile = signal(false);
  readonly sort = signal<CatalogSort>('default');

  readonly catalog = computed<CatalogViewModel>(() => {
    const { context, identifier } = this.routeState();
    const language = this.facade.currentLanguage();

    if (context === 'collection') {
      const collection = this.facade
        .localizedCollectionsWithProducts()
        .find((item) => item.id === identifier || item.slug === identifier);
      return {
        context,
        title: collection?.name ?? 'PRODUCTS_PAGE.COLLECTION',
        titleIsKey: !collection,
        parentLabel: 'PRODUCTS_PAGE.COLLECTIONS',
        parentLabelIsKey: true,
        products: this.uniqueProducts(collection?.products ?? []),
        found: Boolean(collection),
      };
    }

    if (context === 'category') {
      const category = this.facade
        .categories()
        .find((item) => item.id === identifier || item.slug === identifier);
      return {
        context,
        title:
          (category?.translations?.[language] as string | undefined) ??
          category?.name ??
          'PRODUCTS_PAGE.CATEGORY',
        titleIsKey: !category,
        parentLabel: 'PRODUCTS_PAGE.CATEGORIES',
        parentLabelIsKey: true,
        products: this.uniqueProducts(
          category
            ? this.facade.products().filter((product) => product.categoryId === category.id)
            : [],
        ),
        found: Boolean(category),
      };
    }

    if (context === 'kit') {
      const kit = this.facade
        .localizedKitsWithProducts()
        .find((item) => item.id === identifier || item.slug === identifier);
      return {
        context,
        title: kit?.name ?? 'PRODUCTS_PAGE.KIT',
        titleIsKey: !kit,
        parentLabel: 'PRODUCTS_PAGE.KITS',
        parentLabelIsKey: true,
        products: this.uniqueProducts(kit?.products ?? []),
        found: Boolean(kit),
      };
    }

    return {
      context: 'all',
      title: 'PRODUCTS_PAGE.ALL_PRODUCTS',
      titleIsKey: true,
      products: this.uniqueProducts(this.facade.products()),
      found: true,
    };
  });

  readonly sortedProducts = computed(() => {
    const products = [...this.catalog().products];
    const language = this.facade.currentLanguage();
    const currency = this.header.currency();

    switch (this.sort()) {
      case 'name-asc':
        return products.sort((a, b) =>
          a.translations[language].name.localeCompare(b.translations[language].name),
        );
      case 'price-asc':
        return products.sort(
          (a, b) => (a.commerce?.prices[currency] ?? 0) - (b.commerce?.prices[currency] ?? 0),
        );
      case 'price-desc':
        return products.sort(
          (a, b) => (b.commerce?.prices[currency] ?? 0) - (a.commerce?.prices[currency] ?? 0),
        );
      default:
        return products;
    }
  });

  readonly productCards = computed(() => this.toProductCards(this.sortedProducts()));
  readonly visibleProducts = computed(() =>
    this.productCards().slice(0, this.visibleLimit()),
  );
  readonly hasMore = computed(() => this.visibleProducts().length < this.productCards().length);
  readonly recommendations = computed(() => {
    const visibleIds = new Set(this.catalog().products.map((product) => product.id));
    const alternatives = this.facade.products().filter((product) => !visibleIds.has(product.id));
    const source = alternatives.length >= 3 ? alternatives : this.facade.products();
    return this.toProductCards(source.slice(0, 3));
  });

  constructor() {
    const previousTheme = this.header.theme();
    this.header.theme.set('black');
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.mobileMediaQuery?.removeEventListener('change', this.handleViewportChange);
      this.header.theme.set(previousTheme);
    });

    afterNextRender(() => {
      this.mobileMediaQuery = matchMedia('(max-width: 600px)');
      this.mobileMediaQuery.addEventListener('change', this.handleViewportChange);
      this.applyViewportMode(this.mobileMediaQuery.matches);
    });
  }

  updateSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as CatalogSort);
    this.visibleLimit.set(
      this.isMobile() ? MOBILE_INITIAL_PRODUCT_LIMIT : DESKTOP_INITIAL_PRODUCT_LIMIT,
    );
  }

  loadMoreProducts(): void {
    if (!this.hasMore()) return;
    this.visibleLimit.update(
      (limit) =>
        limit +
        (this.isMobile() ? MOBILE_PRODUCT_BATCH_SIZE : DESKTOP_PRODUCT_BATCH_SIZE),
    );
  }

  openProduct(productId: string): void {
    void this.router.navigate(['/produtos', productId]);
  }

  addToCart(productId: string): void {
    this.cart.add(productId);
  }

  private observeLoadingSentinel(): void {
    const sentinel = this.loadSentinel()?.nativeElement;
    this.observer?.disconnect();
    this.observer = null;
    if (
      !this.isBrowser ||
      this.isMobile() ||
      !sentinel ||
      !('IntersectionObserver' in window)
    ) return;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && this.hasMore()) {
          this.loadMoreProducts();
        }
      },
      { rootMargin: '20% 0px' },
    );
    this.observer.observe(sentinel);
  }

  private readonly handleViewportChange = (event: MediaQueryListEvent): void => {
    this.applyViewportMode(event.matches);
  };

  private applyViewportMode(isMobile: boolean): void {
    this.isMobile.set(isMobile);
    this.visibleLimit.set(
      isMobile ? MOBILE_INITIAL_PRODUCT_LIMIT : DESKTOP_INITIAL_PRODUCT_LIMIT,
    );
    this.observeLoadingSentinel();
  }

  private uniqueProducts(products: Product[]): Product[] {
    return [...new Map(products.map((product) => [product.id, product])).values()];
  }

  private toProductCards(products: Product[]): ProductCardData[] {
    const language = this.facade.currentLanguage();
    const currency = this.header.currency();
    const categories = this.facade.mappedCategories();

    return products.flatMap((product) => {
      if (!product.commerce) return [];
      const translation = product.translations[language];
      const category = categories.get(product.categoryId);
      return [{
        id: product.id,
        name: translation.name,
        description: translation.description,
        categoryLabel: category?.translations?.[language] ?? category?.name,
        imageUrl: product.images[0] ?? product.thumbnailImage,
        rating: translation.reviews.averageRating,
        totalReviews: translation.reviews.totalReviews,
        currencyLabel: currency === 'AOA' ? 'Kz' : '€',
        priceLabel: formatPrice(product.commerce.prices[currency], currency, language, false),
        available: product.commerce.availability === 'in-stock',
        addedToCart: this.cart.items().some((item) => item.productId === product.id),
        badge: product.commerce.badge,
      }];
    });
  }
}
