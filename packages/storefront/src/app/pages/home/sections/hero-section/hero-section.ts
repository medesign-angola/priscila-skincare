import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CmsService,
  HeaderService,
  HeroSlide,
  ProductFacade,
} from '@org/core';
import {
  HeroCoverComponent,
  HeroSplitComponent,
  PriceFormatPipe,
} from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  readonly header = inject(HeaderService);
  private readonly cms = inject(CmsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly heroRoot = viewChild<ElementRef<HTMLElement>>('heroRoot');
  readonly videoPaused = signal(false);
  readonly activeSlideIndex = signal(0);
  readonly cmsSlides = signal<Record<'pt' | 'fr', HeroSlide[]>>({
    pt: [],
    fr: [],
  });
  readonly cmsLoading = signal(true);
  readonly cmsUnavailable = signal(false);
  readonly slides = computed(() => {
    const localizedSlides = this.cmsSlides();
    const language = this.facade.currentLanguage();
    return localizedSlides[language].length > 0
      ? localizedSlides[language]
      : localizedSlides.pt;
  });
  readonly activeSlide = computed(() => {
    const slides = this.slides();
    return slides[this.activeSlideIndex()] ?? slides[0] ?? null;
  });

  constructor() {
    forkJoin({
      pt: this.cms.getHeroSlides('pt').pipe(catchError(() => of([]))),
      fr: this.cms.getHeroSlides('fr').pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ pt, fr }) => {
        this.cmsSlides.set({ pt, fr: fr.length > 0 ? fr : pt });
        this.activeSlideIndex.set(0);
        this.cmsUnavailable.set(pt.length === 0 && fr.length === 0);
        this.cmsLoading.set(false);
      });

    effect(() => {
      this.facade.currentLanguage();
      this.activeSlideIndex.set(0);
      this.videoPaused.set(false);
    });

    effect(() => {
      const activeIndex = this.activeSlideIndex();
      const slideCount = this.slides().length;
      if (activeIndex >= slideCount && slideCount > 0) {
        this.activeSlideIndex.set(0);
      }
      this.videoPaused.set(false);
    });
  }

  selectSlide(index: number): void {
    if (index < 0 || index >= this.slides().length) return;
    this.activeSlideIndex.set(index);
  }

  openAction(event: MouseEvent, slide: HeroSlide): void {
    const action = slide.action;
    if (!action || action.external) return;
    event.preventDefault();
    void this.router.navigateByUrl(action.href);
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
