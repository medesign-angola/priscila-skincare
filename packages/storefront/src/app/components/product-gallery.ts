import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-product-gallery',
  imports: [TranslatePipe],
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGallery {
  readonly images = input.required<readonly string[]>();
  readonly alt = input('');
  readonly activeImageIndex = signal(0);
  readonly activeImage = computed(() => this.images()[this.activeImageIndex()] ?? '');
  selectImage(index: number): void { this.activeImageIndex.set(index); }
  formatIndex(index: number): string { return String(index + 1).padStart(2, '0'); }
}
