import { Directive, HostListener, signal } from '@angular/core';

@Directive({
  selector: '[orgBlurUp]',
  standalone: true,
  exportAs: 'orgBlurUp',
  host: {
    '[class.loaded]': 'loaded()',
    '[class.loading]': '!loaded()',
  },
})
export class BlurUpDirective {
  loaded = signal(false);

  @HostListener('load')
  onImageLoad() {
    this.loaded.set(true);
  }

  @HostListener('playing')
  onVideoPlay() {
    this.loaded.set(true);
  }
}
