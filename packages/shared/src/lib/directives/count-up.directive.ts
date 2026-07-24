import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[orgCountUp]',
})
export class CountUpDirective implements AfterViewInit, OnDestroy {
  readonly value = input.required<string | number>({ alias: 'orgCountUp' });
  readonly duration = input(1200, { alias: 'orgCountUpDuration' });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;
  private animationFrame?: number;
  private animated = false;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      this.renderFinalValue();
      return;
    }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.renderFinalValue();
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || this.animated) return;
        this.animated = true;
        this.observer?.disconnect();
        this.animate();
      },
      { threshold: 0.35 },
    );
    this.observer.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame);
  }

  private animate(): void {
    const finalValue = String(this.value());
    const target = Number.parseFloat(finalValue.replace(/[^\d.]/g, '')) || 0;
    const suffix = finalValue.replace(/[\d.,\s]/g, '');
    const startedAt = performance.now();

    const draw = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / this.duration());
      const eased = 1 - Math.pow(1 - progress, 3);
      this.element.nativeElement.textContent = `${Math.round(target * eased)}${suffix}`;

      if (progress < 1) this.animationFrame = requestAnimationFrame(draw);
      else this.renderFinalValue();
    };

    this.animationFrame = requestAnimationFrame(draw);
  }

  private renderFinalValue(): void {
    this.element.nativeElement.textContent = String(this.value());
  }
}
