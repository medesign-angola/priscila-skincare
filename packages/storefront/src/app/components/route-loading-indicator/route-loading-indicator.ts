import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

const SHOW_DELAY = 80;
const MINIMUM_VISIBLE_TIME = 240;

@Component({
  selector: 'app-route-loading-indicator',
  imports: [TranslatePipe],
  templateUrl: './route-loading-indicator.html',
  styleUrl: './route-loading-indicator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteLoadingIndicator {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private visibleSince = 0;

  readonly visible = signal(false);

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (
          event instanceof NavigationStart ||
          event instanceof RouteConfigLoadStart
        ) {
          this.scheduleShow();
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.scheduleHide();
        }
      });

    afterNextRender(() => {
      window.dispatchEvent(new Event('priscila-app-hydrated'));
    });

    this.destroyRef.onDestroy(() => {
      if (this.showTimer) clearTimeout(this.showTimer);
      if (this.hideTimer) clearTimeout(this.hideTimer);
    });
  }

  private scheduleShow(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (this.visible() || this.showTimer) return;

    this.showTimer = setTimeout(() => {
      this.visibleSince = Date.now();
      this.visible.set(true);
      this.showTimer = undefined;
    }, SHOW_DELAY);
  }

  private scheduleHide(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = undefined;
    }
    if (!this.visible()) return;

    const elapsed = Date.now() - this.visibleSince;
    const remaining = Math.max(0, MINIMUM_VISIBLE_TIME - elapsed);
    this.hideTimer = setTimeout(() => {
      this.visible.set(false);
      this.hideTimer = undefined;
    }, remaining);
  }
}
