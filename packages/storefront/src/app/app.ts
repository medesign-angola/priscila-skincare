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
  formatPrice,
} from '@org/shared';
import { AuthFacade, CartFacade, ProductFacade, HeaderService } from '@org/core';
import { RouteLoadingIndicator } from './components/route-loading-indicator/route-loading-indicator';

@Component({
  imports: [
    RouterModule,
    HeaderComponent,
    FooterComponent,
    RouteLoadingIndicator,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly facade = inject(ProductFacade);
  readonly headerService = inject(HeaderService);
  readonly cart = inject(CartFacade);
  readonly auth = inject(AuthFacade);
  private readonly translateService = inject(TranslateService);
  private readonly documentTitle = inject(Title);
  private readonly router = inject(Router);
  private readonly currentUrl = signal(this.router.url);
  readonly shellMode = signal<'storefront' | 'auth' | 'account'>('storefront');
  readonly showFooter = computed(() => this.shellMode() === 'storefront');
  readonly accountRoute = computed(() =>
    this.auth.isAuthenticated() ? '/conta/encomendas' : '/entrar',
  );
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
  readonly headerCartItems = computed(() => {
    const language = this.facade.currentLanguage();
    const currency = this.headerService.currency();

    return [...this.cart.resolvedItems().map((item) => ({
      key: `${item.productId}:${item.sizeId}`,
      itemType: 'product' as const,
      reference: item.productSku,
      productId: item.productId,
      sizeId: item.sizeId,
      name: item.product.translations[language].name,
      image: item.product.thumbnailImage,
      size: item.size?.value ?? '',
      quantity: item.quantity,
      price: formatPrice(
        (item.product.commerce?.prices[currency] ?? 0) * item.quantity,
        currency,
        language,
      ),
    })), ...this.cart.bundles().map((item) => ({ key: `${item.type}:${item.id}`, itemType: item.type, reference: item.id, productId: item.id, sizeId: '', name: item.name, image: item.image, size: `${item.productCount} produtos`, quantity: item.quantity, price: formatPrice(item.prices[currency] * item.quantity, currency, language) }))];
  });
  readonly headerCartTotal = computed(() => {
    const currency = this.headerService.currency();
    return formatPrice(
      this.cart.subtotal()[currency],
      currency,
      this.facade.currentLanguage(),
    );
  });
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
  private readonly fallbackFooterSocialLinks: readonly FooterSocialLink[] = [
    { id: 'instagram', index: '01', label: 'Instagram' },
    { id: 'facebook', index: '02', label: 'Facebook' },
    { id: 'tiktok', index: '03', label: 'TikTok' },
  ];
  readonly footerSocialLinks = computed<readonly FooterSocialLink[]>(() => {
    const links = this.facade.siteSetting()?.socialLinks ?? [];
    return links.length > 0
      ? links.map((link, index) => ({
          ...link,
          index: String(index + 1).padStart(2, '0'),
        }))
      : this.fallbackFooterSocialLinks;
  });
  readonly footerBackgroundUrl = computed(
    () =>
      this.facade.siteSetting()?.footerBackgroundUrl ??
      '/assets/images/footer/footer-background.webp',
  );

  constructor() {
    this.updateShellMode(this.router.url);
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.updateShellMode(event.urlAfterRedirects);
      });
    effect(() => {
      const language = this.facade.currentLanguage();
      this.translateService.use(language).subscribe();
    });
    effect(() => {
      const language = this.facade.currentLanguage();
      const siteName =
        this.facade.siteSetting()?.siteName || 'Priscila Skincare';
      const pageTitle = this.resolvePageTitle(this.currentUrl(), language);
      this.documentTitle.setTitle(
        pageTitle ? `${pageTitle} | ${siteName}` : siteName,
      );
    });

    afterNextRender(async () => {
      await this.auth.ensureSession();
      await this.cart.synchronize();

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

    void this.router.navigate(['/colecoes', selection.id]);
  }

  handleNewsletterSubmit(email: string): void {
    void email;
  }

  handleCartItem(
    action: 'remove' | 'increment' | 'decrement',
    item: { itemType: 'product' | 'kit' | 'collection'; reference: string; productId: string; sizeId: string },
  ): void {
    if (item.itemType === 'kit' || item.itemType === 'collection') {
      if (action === 'remove') this.cart.removeBundle(item.reference, item.itemType);
      if (action === 'increment') this.cart.incrementBundle(item.reference, item.itemType);
      if (action === 'decrement') this.cart.decrementBundle(item.reference, item.itemType);
      return;
    }
    this.cart[action](item.productId, item.sizeId);
  }

  private resolvePageTitle(url: string, language: 'pt' | 'fr'): string | null {
    const path = decodeURIComponent(url.split(/[?#]/, 1)[0]).replace(/\/+$/, '');
    const labels =
      language === 'fr'
        ? {
            about: 'À propos',
            account: 'Mon compte',
            checkout: 'Finaliser la commande',
            collection: 'Collection',
            kit: 'Coffret',
            login: 'Connexion',
            order: 'Détails de la commande',
            orders: 'Mes commandes',
            otp: 'Vérifier le code',
            product: 'Produit',
            products: 'Produits',
            profile: 'Mon profil',
            review: 'Donner mon avis',
            reviewSent: 'Avis envoyé',
          }
        : {
            about: 'Sobre',
            account: 'Minha conta',
            checkout: 'Finalizar compra',
            collection: 'Coleção',
            kit: 'Kit',
            login: 'Entrar',
            order: 'Detalhes da encomenda',
            orders: 'Minhas encomendas',
            otp: 'Verificar código',
            product: 'Produto',
            products: 'Produtos',
            profile: 'Meu perfil',
            review: 'Avaliar produto',
            reviewSent: 'Avaliação enviada',
          };

    if (!path) return null;
    if (path === '/sobre') return labels.about;
    if (path === '/entrar') return labels.login;
    if (path === '/verificar-codigo') return labels.otp;
    if (path === '/checkout') return labels.checkout;
    if (path === '/avaliar') return labels.review;
    if (path === '/avaliacao-enviada') return labels.reviewSent;
    if (path === '/conta') return labels.account;
    if (path === '/conta/perfil') return labels.profile;
    if (path === '/conta/encomendas') return labels.orders;
    if (/^\/conta\/encomendas\/[^/]+$/.test(path)) return labels.order;

    const segments = path.split('/').filter(Boolean);
    const resourceId = segments.at(-1) ?? '';

    if (segments[0] === 'kits' && segments.length === 2) {
      return (
        this.facade
          .localizedKitsWithProducts()
          .find((kit) => kit.id === resourceId || kit.slug === resourceId)
          ?.name ?? labels.kit
      );
    }

    if (segments[0] === 'colecoes' && segments.length === 2) {
      return (
        this.facade
          .localizedCollectionsWithProducts()
          .find(
            (collection) =>
              collection.id === resourceId || collection.slug === resourceId,
          )?.name ?? labels.collection
      );
    }

    if (segments[0] !== 'produtos') return null;
    if (segments.length === 1) return labels.products;
    if (segments.at(-1) === 'avaliar') return labels.review;
    if (segments.at(-1) === 'avaliacao-enviada') return labels.reviewSent;

    if (segments.length === 3) {
      const context = segments[1];
      if (context === 'colecao') {
        return (
          this.facade
            .localizedCollectionsWithProducts()
            .find(
              (collection) =>
                collection.id === resourceId || collection.slug === resourceId,
            )?.name ?? labels.collection
        );
      }
      if (context === 'kit') {
        return (
          this.facade
            .localizedKitsWithProducts()
            .find((kit) => kit.id === resourceId || kit.slug === resourceId)
            ?.name ?? labels.kit
        );
      }
      if (context === 'categoria') {
        const category = this.facade
          .categories()
          .find(
            (candidate) =>
              candidate.id === resourceId || candidate.slug === resourceId,
          );
        return (
          category?.translations?.[language] ??
          category?.name ??
          labels.products
        );
      }
    }

    const product = this.facade
      .products()
      .find(
        (candidate) =>
          candidate.id === resourceId || candidate.slug === resourceId,
      );
    return product?.translations[language].name ?? labels.product;
  }

  handleCheckout(): void {
    void this.router.navigate([this.auth.isAuthenticated() ? '/checkout' : '/entrar'], {
      queryParams: this.auth.isAuthenticated() ? undefined : { returnUrl: '/checkout' },
    });
  }
}
