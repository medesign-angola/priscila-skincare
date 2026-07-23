import {
  Component,
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
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface HeaderNavigationItem {
  id: string;
  name: string;
  image: string;
}

export interface HeaderCartItem {
  key: string;
  productId: string;
  sizeId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  price: string;
}

type HeaderNavigationMenu = 'products' | 'collections';

@Component({
  selector: 'org-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

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
  readonly draftLanguage = signal<'pt' | 'fr'>('pt');
  readonly draftCurrency = signal<'AOA' | 'EUR'>('AOA');
  readonly currencyOptions = [
    { value: 'AOA', code: 'KZ', marketKey: 'PREFERENCES.ANGOLA' },
    { value: 'EUR', code: 'EUR', marketKey: 'PREFERENCES.EUROPE' },
  ] as const;

  languageChange = output<'pt' | 'fr'>();
  currencyChange = output<'AOA' | 'EUR'>();
  cartRemove = output<{ productId: string; sizeId: string }>();
  cartIncrement = output<{ productId: string; sizeId: string }>();
  cartDecrement = output<{ productId: string; sizeId: string }>();
  cartCheckout = output<void>();

  navigationItemRoute(itemId: string): readonly string[] {
    return this.displayedNavigationMenu() === 'collections'
      ? ['/produtos', 'colecao', itemId]
      : ['/produtos', itemId];
  }

  constructor() {
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
