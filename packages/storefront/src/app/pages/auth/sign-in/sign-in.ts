import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '@org/core';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, UpperCasePipe],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly marketing = new FormControl(false, { nonNullable: true });
  readonly emailFocused = signal(false);

  async submit(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    try {
      await this.auth.requestCode(this.email.value.trim(), this.marketing.value);
      await this.router.navigate(['/verificar-codigo'], {
        queryParams: { returnUrl: this.route.snapshot.queryParamMap.get('returnUrl') },
      });
    } catch {
      // A mensagem traduzida é apresentada pelo template.
    }
  }
}
