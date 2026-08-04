import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '@org/core';

@Component({ selector: 'app-otp', imports: [RouterLink, TranslatePipe, UpperCasePipe], templateUrl: './otp.html', styleUrl: './otp.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class Otp {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('digit');
  readonly digits = ['', '', '', '', '', ''];
  readonly invalid = signal(false);
  readonly submitting = signal(false);

  constructor() {
    const interval = setInterval(() => {
      if (this.auth.resendSeconds() > 0) this.auth.resendSeconds.update((value) => value - 1);
    }, 1_000);
    inject(DestroyRef).onDestroy(() => clearInterval(interval));
  }

  update(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.digits[index] = input.value.replace(/\D/g, '').slice(-1);
    input.value = this.digits[index];
    this.invalid.set(false);
    if (this.digits[index] && index < 5) this.inputs()[index + 1]?.nativeElement.focus();
    if (this.digits.every(Boolean)) void this.submit();
  }

  keydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) this.inputs()[index - 1]?.nativeElement.focus();
  }

  paste(event: ClipboardEvent): void {
    const code = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (!code) return;
    event.preventDefault();
    code.split('').forEach((value, index) => {
      this.digits[index] = value;
      const input = this.inputs()[index]?.nativeElement;
      if (input) input.value = value;
    });
    if (code.length === 6) void this.submit();
  }

  async resend(): Promise<void> {
    if (this.auth.resendSeconds() > 0 || this.auth.loading()) return;
    try {
      await this.auth.requestCode(this.auth.pendingEmail());
      this.invalid.set(false);
    } catch {
      this.invalid.set(true);
    }
  }

  private async submit(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.invalid.set(!(await this.auth.verifyCode(this.digits.join(''))));
    this.submitting.set(false);
    if (!this.invalid()) {
      const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const returnUrl = requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//')
        ? requestedUrl
        : '/conta/encomendas';
      await this.router.navigateByUrl(returnUrl);
    }
  }
}
