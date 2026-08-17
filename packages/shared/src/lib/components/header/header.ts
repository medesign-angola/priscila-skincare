import {
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

export interface HeaderNavigationItem {
  id: string;
  name: string;
  image: string;
}

export interface HeaderCartItem {
  key: string;
  itemType: 'product' | 'kit' | 'collection';
  reference: string;
  productId: string;
  sizeId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  price: string;
}

type HeaderNavigationMenu = 'products' | 'collections';
type MobileNavigationPanel = 'main' | HeaderNavigationMenu;

@Component({
  selector: 'org-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private static readonly mobileNavigationTransitionMs = 260;

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  @ViewChild('productsMenuTrigger')
  private productsMenuTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('collectionsMenuTrigger')
  private collectionsMenuTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('preferencesTrigger')
  private preferencesTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('preferencesCloseButton')
  private preferencesCloseButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('preferencesDialog')
  private preferencesDialog?: ElementRef<HTMLElement>;
  @ViewChild('cartTrigger')
  private cartTrigger?: ElementRef<HTMLButtonElement>;

  theme = input<'white' | 'black'>('white');
  mode = input<'storefront' | 'auth' | 'account'>('storefront');
  currentLanguage = input<'pt' | 'fr'>('pt');
  currency = input<'AOA' | 'EUR'>('AOA');
  products = input<readonly HeaderNavigationItem[]>([]);
  collections = input<readonly HeaderNavigationItem[]>([]);
  cartItems = input<readonly HeaderCartItem[]>([]);
  cartCount = input(0);
  cartTotal = input('');
  accountRoute = input('/entrar');

  readonly activeNavigationMenu = signal<HeaderNavigationMenu | null>(null);
  readonly displayedNavigationMenu = signal<HeaderNavigationMenu>('products');
  readonly navigationMenuInitialized = signal(false);
  readonly navigationMenuItems = computed(() =>
    this.displayedNavigationMenu() === 'collections'
      ? this.collections()
      : this.products(),
  );
  readonly navigationMenuRoute = computed(() =>
    '/produtos',
  );
  readonly navigationMenuLabel = computed(() =>
    this.displayedNavigationMenu() === 'collections'
      ? 'HEADER.COLLECTIONS'
      : 'HEADER.PRODUCTS',
  );
  readonly preferencesOpen = signal(false);
  readonly preferencesInitialized = signal(false);
  readonly cartOpen = signal(false);
  readonly cartInitialized = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly mobileMenuRendered = signal(false);
  readonly mobileNavigationPanel = signal<MobileNavigationPanel>('main');
  readonly draftLanguage = signal<'pt' | 'fr'>('pt');
  readonly draftCurrency = signal<'AOA' | 'EUR'>('AOA');
  readonly currencyOptions = [
    { value: 'AOA', code: 'KZ', marketKey: 'PREFERENCES.ANGOLA' },
    { value: 'EUR', code: 'EUR', marketKey: 'PREFERENCES.EUROPE' },
  ] as const;

  languageChange = output<'pt' | 'fr'>();
  currencyChange = output<'AOA' | 'EUR'>();
  cartRemove = output<Pick<HeaderCartItem, 'itemType' | 'reference' | 'productId' | 'sizeId'>>();
  cartIncrement = output<Pick<HeaderCartItem, 'itemType' | 'reference' | 'productId' | 'sizeId'>>();
  cartDecrement = output<Pick<HeaderCartItem, 'itemType' | 'reference' | 'productId' | 'sizeId'>>();
  cartCheckout = output<void>();
  private mobileNavigationCloseTimeout: ReturnType<typeof setTimeout> | null =
    null;

  navigationItemRoute(itemId: string): readonly string[] {
    return this.displayedNavigationMenu() === 'collections'
      ? ['/colecoes', itemId]
      : ['/produtos', itemId];
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.mobileNavigationCloseTimeout) {
        clearTimeout(this.mobileNavigationCloseTimeout);
      }
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeNavigationMenu();
        this.closePreferences(false);
        this.closeCart();
        this.closeMobileNavigation();
      });

    effect((onCleanup) => {
      if (!this.mobileMenuRendered()) return;
      this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
      onCleanup(() => this.renderer.removeStyle(this.document.body, 'overflow'));
    });

    effect((onCleanup) => {
      if (!this.activeNavigationMenu()) return;

      const removeClickListener = this.renderer.listen(
        'document',
        'click',
        (event: MouseEvent) => {
          if (!this.elementRef.nativeElement.contains(event.target as Node)) {
            this.closeNavigationMenu();
          }
        },
      );
      const removeKeyListener = this.renderer.listen(
        'document',
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            this.closeNavigationMenu(true);
          }
        },
      );

      onCleanup(() => {
        removeClickListener();
        removeKeyListener();
      });
    });

    effect((onCleanup) => {
      if (!this.preferencesOpen()) return;

      const removeKeyListener = this.renderer.listen(
        'document',
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            this.closePreferences(true);
            return;
          }

          if (event.key === 'Tab') {
            this.keepFocusInPreferences(event);
          }
        },
      );

      onCleanup(removeKeyListener);
    });

    effect((onCleanup) => {
      if (!this.cartOpen()) return;

      const removeKeyListener = this.renderer.listen(
        'document',
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === 'Escape') this.closeCart(true);
        },
      );
      const removeClickListener = this.renderer.listen(
        'document',
        'click',
        (event: MouseEvent) => {
          if (!this.elementRef.nativeElement.contains(event.target as Node)) {
            this.closeCart();
          }
        },
      );

      onCleanup(() => {
        removeKeyListener();
        removeClickListener();
      });
    });
  }

  toggleNavigationMenu(menu: HeaderNavigationMenu): void {
    this.closePreferences(false);
    this.closeCart();
    this.navigationMenuInitialized.set(true);
    this.displayedNavigationMenu.set(menu);
    this.activeNavigationMenu.update((activeMenu) =>
      activeMenu === menu ? null : menu,
    );
  }

  toggleMobileNavigation(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileNavigation();
      return;
    }

    this.closeNavigationMenu();
    this.closePreferences(false);
    this.closeCart();
    if (this.mobileNavigationCloseTimeout) {
      clearTimeout(this.mobileNavigationCloseTimeout);
      this.mobileNavigationCloseTimeout = null;
    }
    this.mobileNavigationPanel.set('main');
    this.mobileMenuRendered.set(true);
    this.mobileMenuOpen.set(true);
  }

  openMobileSubmenu(menu: HeaderNavigationMenu): void {
    this.displayedNavigationMenu.set(menu);
    this.mobileNavigationPanel.set(menu);
  }

  closeMobileNavigation(): void {
    if (!this.mobileMenuRendered()) return;

    this.mobileMenuOpen.set(false);
    if (this.mobileNavigationCloseTimeout) {
      clearTimeout(this.mobileNavigationCloseTimeout);
    }
    this.mobileNavigationCloseTimeout = setTimeout(() => {
      this.mobileMenuRendered.set(false);
      this.mobileNavigationPanel.set('main');
      this.mobileNavigationCloseTimeout = null;
    }, HeaderComponent.mobileNavigationTransitionMs);
  }

  closeNavigationMenu(restoreFocus = false): void {
    const activeMenu = this.activeNavigationMenu();
    if (!activeMenu) return;

    this.activeNavigationMenu.set(null);
    if (restoreFocus) {
      const trigger =
        activeMenu === 'collections'
          ? this.collectionsMenuTrigger
          : this.productsMenuTrigger;
      trigger?.nativeElement.focus();
    }
  }

  openPreferences(): void {
    this.closeMobileNavigation();
    this.closeNavigationMenu();
    this.closeCart();
    this.preferencesInitialized.set(true);
    this.draftLanguage.set(this.currentLanguage());
    this.draftCurrency.set(this.currency());
    this.preferencesOpen.set(true);

    setTimeout(() => this.preferencesCloseButton?.nativeElement.focus());
  }

  closePreferences(restoreFocus = true): void {
    if (!this.preferencesOpen()) return;

    this.preferencesOpen.set(false);
    if (restoreFocus) {
      this.preferencesTrigger?.nativeElement.focus();
    }
  }

  applyPreferences(): void {
    this.languageChange.emit(this.draftLanguage());
    this.currencyChange.emit(this.draftCurrency());
    this.closePreferences();
  }

  toggleCart(): void {
    if (this.cartOpen()) {
      this.closeCart(true);
      return;
    }

    this.closeMobileNavigation();
    this.closeNavigationMenu();
    this.closePreferences(false);
    this.cartInitialized.set(true);
    this.cartOpen.set(true);
  }

  closeCart(restoreFocus = false): void {
    if (!this.cartOpen()) return;
    this.cartOpen.set(false);
    if (restoreFocus) this.cartTrigger?.nativeElement.focus();
  }

  private keepFocusInPreferences(event: KeyboardEvent): void {
    const focusableElements = Array.from(
      this.preferencesDialog?.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled])',
      ) ?? [],
    );
    const firstElement = focusableElements.at(0);
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
