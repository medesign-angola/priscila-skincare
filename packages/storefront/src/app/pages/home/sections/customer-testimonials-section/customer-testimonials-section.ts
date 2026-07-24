import { DecimalPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductFacade, VideoTestimonial } from '@org/core';

@Component({
  selector: 'app-customer-testimonials-section',
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './customer-testimonials-section.html',
  styleUrl: './customer-testimonials-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerTestimonialsSection {
  private static readonly videosPerPage = 3;

  private readonly facade = inject(ProductFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sectionRoot =
    viewChild<ElementRef<HTMLElement>>('sectionRoot');
  private readonly videoElements =
    viewChildren<ElementRef<HTMLVideoElement>>('testimonialVideo');
  private intersectionObserver: IntersectionObserver | null = null;
  private playbackTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSectionVisible = false;
  private autoplayEnabled = true;
  private sequencePausedByUser = false;
  private destroyed = false;

  readonly activePage = signal(0);
  readonly activeTestimonialId = signal<string | null>(null);
  readonly playingVideoIds = signal<ReadonlySet<string>>(new Set());
  readonly unmutedVideoIds = signal<ReadonlySet<string>>(new Set());
  readonly videoTimes = signal<
    ReadonlyMap<string, { current: number; duration: number }>
  >(new Map());
  readonly presentation = this.facade.homeTestimonials;
  readonly reviewsSummary = this.facade.globalReviewsSummary;

  readonly pages = computed(() => {
    const testimonials = this.presentation()?.testimonials ?? [];
    const pages: VideoTestimonial[][] = [];

    for (
      let index = 0;
      index < testimonials.length;
      index += CustomerTestimonialsSection.videosPerPage
    ) {
      pages.push(
        testimonials.slice(
          index,
          index + CustomerTestimonialsSection.videosPerPage,
        ),
      );
    }

    return pages;
  });

  readonly totalPages = computed(() => this.pages().length);
  readonly trackTransform = computed(
    () => `translate3d(-${this.activePage() * 100}%, 0, 0)`,
  );

  constructor() {
    afterNextRender(() => {
      const connection = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection;
      this.autoplayEnabled =
        !matchMedia('(prefers-reduced-motion: reduce)').matches &&
        !connection?.saveData;
      this.selectFirstVideoOnActivePage();
      this.observeSection();
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.intersectionObserver?.disconnect();
      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
    });
  }

  previousPage(): void {
    const totalPages = this.totalPages();
    if (totalPages <= 1) return;
    this.goToPage((this.activePage() - 1 + totalPages) % totalPages);
  }

  nextPage(): void {
    const totalPages = this.totalPages();
    if (totalPages <= 1) return;
    this.goToPage((this.activePage() + 1) % totalPages);
  }

  togglePlayback(testimonialId: string): void {
    const video = this.findVideo(testimonialId);
    if (!video) return;

    if (video.paused) {
      this.sequencePausedByUser = false;
      this.activeTestimonialId.set(testimonialId);
      this.pauseAllVideos(testimonialId);
      void video.play().catch(() => undefined);
    } else {
      this.sequencePausedByUser = true;
      video.pause();
    }
  }

  toggleMute(testimonialId: string): void {
    const video = this.findVideo(testimonialId);
    if (!video) return;

    video.muted = !video.muted;
    this.unmutedVideoIds.update((currentIds) => {
      const nextIds = new Set(currentIds);
      if (video.muted) nextIds.delete(testimonialId);
      else nextIds.add(testimonialId);
      return nextIds;
    });
  }

  onVideoReady(
    video: HTMLVideoElement,
    pageIndex: number,
    testimonialId: string,
  ): void {
    if (
      !this.autoplayEnabled ||
      this.sequencePausedByUser ||
      pageIndex !== this.activePage() ||
      testimonialId !== this.activeTestimonialId() ||
      !this.isSectionVisible
    ) {
      return;
    }
    void video.play().catch(() => undefined);
  }

  onVideoPlay(testimonialId: string): void {
    this.activeTestimonialId.set(testimonialId);
    this.pauseAllVideos(testimonialId);
    this.updatePlayingState(testimonialId, true);
  }

  onVideoPause(testimonialId: string): void {
    this.updatePlayingState(testimonialId, false);
  }

  updateVideoTime(testimonialId: string, video: HTMLVideoElement): void {
    this.videoTimes.update((times) => {
      const next = new Map(times);
      next.set(testimonialId, {
        current: Number.isFinite(video.currentTime) ? video.currentTime : 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
      return next;
    });
  }

  videoTimer(testimonialId: string): string {
    const time = this.videoTimes().get(testimonialId);
    return `${this.formatTime(time?.current ?? 0)} / ${this.formatTime(
      time?.duration ?? 0,
    )}`;
  }

  onVideoEnded(testimonialId: string, pageIndex: number): void {
    this.updatePlayingState(testimonialId, false);
    if (pageIndex !== this.activePage() || this.sequencePausedByUser) return;

    const page = this.pages()[pageIndex] ?? [];
    const currentIndex = page.findIndex(
      (testimonial) => testimonial.id === testimonialId,
    );
    if (currentIndex < 0 || page.length === 0) return;

    const nextTestimonial = page[(currentIndex + 1) % page.length];
    this.activeTestimonialId.set(nextTestimonial.id);
    this.playSelectedVideo();
  }

  isPlaying(testimonialId: string): boolean {
    return this.playingVideoIds().has(testimonialId);
  }

  isMuted(testimonialId: string): boolean {
    return !this.unmutedVideoIds().has(testimonialId);
  }

  videoPreload(
    testimonialId: string,
    pageIndex: number,
  ): 'auto' | 'metadata' | 'none' {
    if (pageIndex !== this.activePage()) return 'none';
    return testimonialId === this.activeTestimonialId() ? 'auto' : 'metadata';
  }

  leaveReview(): void {
    console.log('Abrir formulário de avaliação');
  }

  private goToPage(pageIndex: number): void {
    this.pauseAllVideos();
    this.activePage.set(pageIndex);
    this.sequencePausedByUser = false;
    this.selectFirstVideoOnActivePage();

    if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
    this.playbackTimeout = setTimeout(() => {
      if (!this.destroyed) this.playSelectedVideo();
    }, 420);
  }

  private observeSection(): void {
    const section = this.sectionRoot()?.nativeElement;
    if (!section) return;

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (this.destroyed || !entry) return;
        this.isSectionVisible = entry.isIntersecting;
        if (entry.isIntersecting) this.playSelectedVideo();
        else this.pauseAllVideos();
      },
      { threshold: 0.2 },
    );
    this.intersectionObserver.observe(section);
  }

  private playSelectedVideo(): void {
    if (
      this.destroyed ||
      !this.autoplayEnabled ||
      this.sequencePausedByUser ||
      !this.isSectionVisible
    ) {
      return;
    }

    const testimonialId = this.activeTestimonialId();
    if (!testimonialId) return;

    const video = this.findVideo(testimonialId);
    if (!video) return;

    this.pauseAllVideos(testimonialId);
    void video.play().catch(() => undefined);
  }

  private pauseAllVideos(exceptTestimonialId?: string): void {
    for (const elementRef of this.videoElements()) {
      const video = elementRef?.nativeElement;
      if (
        !video ||
        !video.isConnected ||
        video.dataset['testimonialId'] === exceptTestimonialId
      ) {
        continue;
      }

      video.pause();
    }
  }

  private selectFirstVideoOnActivePage(): void {
    const firstTestimonial = this.pages()[this.activePage()]?.[0];
    this.activeTestimonialId.set(firstTestimonial?.id ?? null);
  }

  private findVideo(testimonialId: string): HTMLVideoElement | undefined {
    return this.videoElements()
      .map((elementRef) => elementRef?.nativeElement)
      .find((video): video is HTMLVideoElement =>
        Boolean(
          video?.isConnected &&
          video.dataset['testimonialId'] === testimonialId,
        ),
      );
  }

  private updatePlayingState(testimonialId: string, isPlaying: boolean): void {
    this.playingVideoIds.update((currentIds) => {
      const nextIds = new Set(currentIds);
      if (isPlaying) nextIds.add(testimonialId);
      else nextIds.delete(testimonialId);
      return nextIds;
    });
  }

  private formatTime(seconds: number): string {
    const rounded = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(rounded / 60);
    return `${String(minutes).padStart(2, '0')}:${String(
      rounded % 60,
    ).padStart(2, '0')}`;
  }
}
