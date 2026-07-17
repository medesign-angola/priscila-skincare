import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { Product } from '@org/core';

@Component({
  selector: 'app-product-results-section',
  imports: [],
  templateUrl: './product-results-section.html',
  styleUrl: './product-results-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductResultsSection {
  readonly product = input.required<Product>();
  readonly language = input.required<'pt' | 'fr'>();
  readonly position = signal(50);
  readonly content = computed(
    () => this.product().translations[this.language()].result,
  );

  updateFromPointer(event: PointerEvent): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.position.set(
      Math.max(
        0,
        Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
      ),
    );
  }

  updateFromKeyboard(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft')
      this.position.update((value) => Math.max(0, value - 5));
    if (event.key === 'ArrowRight')
      this.position.update((value) => Math.min(100, value + 5));
  }
}
