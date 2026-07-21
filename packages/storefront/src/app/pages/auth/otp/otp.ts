import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChildren } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '@org/core';

@Component({ selector: 'app-otp', imports: [RouterLink, TranslatePipe], templateUrl: './otp.html', styleUrl: './otp.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class Otp {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('digit');
  readonly digits = ['', '', '', '', '', ''];
  invalid = false;

  update(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.digits[index] = input.value.replace(/\D/g, '').slice(-1);
    input.value = this.digits[index];
    if (this.digits[index] && index < 5) this.inputs()[index + 1]?.nativeElement.focus();
    if (this.digits.every(Boolean)) this.submit();
  }

  keydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) this.inputs()[index - 1]?.nativeElement.focus();
  }

  paste(event: ClipboardEvent): void {
    const code = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (!code) return;
    event.preventDefault();
    code.split('').forEach((value, index) => { this.digits[index] = value; const input = this.inputs()[index]?.nativeElement; if (input) input.value = value; });
    if (code.length === 6) this.submit();
  }

  private submit(): void {
    this.invalid = !this.auth.verifyCode(this.digits.join(''));
    if (!this.invalid) void this.router.navigate(['/conta/encomendas']);
  }
}
