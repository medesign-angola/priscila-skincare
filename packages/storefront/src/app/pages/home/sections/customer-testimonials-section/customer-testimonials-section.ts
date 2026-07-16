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

  readonly activePage = signal(0);
  readonly playingVideoIds = signal<ReadonlySet<string>>(new Set());
  readonly unmutedVideoIds = signal<ReadonlySet<string>>(new Set());
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
    afterNextRender(() => this.observeSection());

    this.destroyRef.onDestroy(() => {
      this.intersectionObserver?.disconnect();
      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
      this.pauseAllVideos();
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
      void video.play().catch(() => undefined);
    } else {
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

  onVideoReady(video: HTMLVideoElement, pageIndex: number): void {
    if (pageIndex !== this.activePage() || !this.isSectionVisible) return;
    void video.play().catch(() => undefined);
  }

  onVideoPlay(testimonialId: string): void {
    this.updatePlayingState(testimonialId, true);
  }

  onVideoPause(testimonialId: string): void {
    this.updatePlayingState(testimonialId, false);
  }

  isPlaying(testimonialId: string): boolean {
    return this.playingVideoIds().has(testimonialId);
  }

  isMuted(testimonialId: string): boolean {
    return !this.unmutedVideoIds().has(testimonialId);
  }

  leaveReview(): void {
    console.log('Abrir formulário de avaliação');
  }

  private goToPage(pageIndex: number): void {
    this.pauseAllVideos();
    this.activePage.set(pageIndex);

    if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
    this.playbackTimeout = setTimeout(() => this.playActivePageVideos(), 420);
  }

  private observeSection(): void {
    const section = this.sectionRoot()?.nativeElement;
    if (!section) return;

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isSectionVisible = entry.isIntersecting;
        if (entry.isIntersecting) this.playActivePageVideos();
        else this.pauseAllVideos();
      },
      { threshold: 0.2 },
    );
    this.intersectionObserver.observe(section);
  }

  private playActivePageVideos(): void {
    if (!this.isSectionVisible) return;

    for (const reference of this.videoElements()) {
      const video = reference.nativeElement;
      const pageIndex = Number(video.dataset['pageIndex']);

      if (pageIndex === this.activePage()) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }
  }

  private pauseAllVideos(): void {
    this.videoElements().forEach(({ nativeElement }) => nativeElement.pause());
  }

  private findVideo(testimonialId: string): HTMLVideoElement | undefined {
    return this.videoElements()
      .map(({ nativeElement }) => nativeElement)
      .find((video) => video.dataset['testimonialId'] === testimonialId);
  }

  private updatePlayingState(testimonialId: string, isPlaying: boolean): void {
    this.playingVideoIds.update((currentIds) => {
      const nextIds = new Set(currentIds);
      if (isPlaying) nextIds.add(testimonialId);
      else nextIds.delete(testimonialId);
      return nextIds;
    });
  }
}
