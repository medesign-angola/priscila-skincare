import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '@org/core';

@Component({ selector: 'app-sign-in', imports: [ReactiveFormsModule, RouterLink, TranslatePipe], templateUrl: './sign-in.html', styleUrl: './sign-in.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class SignIn {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly marketing = new FormControl(false, { nonNullable: true });
  readonly emailFocused = signal(false);

  submit(event?: Event): void {
    event?.preventDefault();
    if (this.email.invalid) { this.email.markAsTouched(); return; }
    this.auth.requestCode(this.email.value.trim());
    void this.router.navigate(['/verificar-codigo']);
  }
}
