import {
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface HeaderProductItem {
  id: string;
  name: string;
  image: string;
}

@Component({
  selector: 'org-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  @ViewChild('productsMenuTrigger')
  private productsMenuTrigger?: ElementRef<HTMLButtonElement>;

  theme = input<'white' | 'black'>('white');
  currentLanguage = input<'pt' | 'fr'>('pt');
  currency = input<'AOA' | 'EUR'>('AOA');
  products = input<readonly HeaderProductItem[]>([]);

  readonly productsMenuOpen = signal(false);
  readonly productsMenuInitialized = signal(false);

  languageChange = output<'pt' | 'fr'>();
  currencyChange = output<'AOA' | 'EUR'>();

  constructor() {
    effect((onCleanup) => {
      if (!this.productsMenuOpen()) return;

      const removeClickListener = this.renderer.listen(
        'document',
        'click',
        (event: MouseEvent) => {
          if (!this.elementRef.nativeElement.contains(event.target as Node)) {
            this.closeProductsMenu();
          }
        },
      );
      const removeKeyListener = this.renderer.listen(
        'document',
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            this.closeProductsMenu(true);
          }
        },
      );

      onCleanup(() => {
        removeClickListener();
        removeKeyListener();
      });
    });
  }

  toggleProductsMenu(): void {
    this.productsMenuInitialized.set(true);
    this.productsMenuOpen.update((open) => !open);
  }

  closeProductsMenu(restoreFocus = false): void {
    if (!this.productsMenuOpen()) return;

    this.productsMenuOpen.set(false);
    if (restoreFocus) {
      this.productsMenuTrigger?.nativeElement.focus();
    }
  }

  formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
