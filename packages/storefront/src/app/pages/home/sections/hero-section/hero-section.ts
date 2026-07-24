import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductFacade } from '@org/core';
import {
  HeroCoverComponent,
  HeroSplitComponent,
  PriceFormatPipe,
} from '@org/shared';
import { inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-hero-section',
  imports: [
    CommonModule,
    HeroCoverComponent,
    HeroSplitComponent,
    PriceFormatPipe,
    TranslatePipe,
  ],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  readonly facade = inject(ProductFacade);
  readonly heroRoot = viewChild<ElementRef<HTMLElement>>('heroRoot');
  readonly videoPaused = signal(false);

  constructor() {
    effect(() => {
      this.facade.activeKitIndex();
      this.videoPaused.set(false);
    });
  }

  buyKit(kitId: string): void {
    console.log('Comprar kit:', kitId);
  }

  toggleActiveVideo(): void {
    const video =
      this.heroRoot()?.nativeElement.querySelector<HTMLVideoElement>(
        '.slide-wrapper.active video',
      );
    if (!video) return;

    if (video.paused) {
      void video.play().then(() => this.videoPaused.set(false));
    } else {
      video.pause();
      this.videoPaused.set(true);
    }
  }
}
