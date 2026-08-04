import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export interface FooterNavigationItem {
  id: string;
  index: string;
  label: string;
  imageUrl: string;
}

export interface FooterSocialLink {
  id: 'instagram' | 'facebook' | 'tiktok';
  index: string;
  label: string;
  url?: string;
}

@Component({
  selector: 'org-footer',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  products = input<readonly FooterNavigationItem[]>([]);
  collections = input<readonly FooterNavigationItem[]>([]);
  socialLinks = input<readonly FooterSocialLink[]>([]);
  backgroundUrl = input('/assets/images/footer/footer-background.webp');
  termsUrl = input<string>();
  privacyUrl = input<string>();
  newsletterHeadline = input<string>();
  currentYear = input(new Date().getFullYear());

  navigationSelect = output<{ type: 'product' | 'collection'; id: string }>();
  newsletterSubmit = output<string>();

  readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  selectNavigationItem(type: 'product' | 'collection', id: string): void {
    this.navigationSelect.emit({ type, id });
  }

  submitNewsletter(): void {
    this.emailControl.markAsTouched();
    if (this.emailControl.invalid) return;

    this.newsletterSubmit.emit(this.emailControl.value.trim());
  }

  scrollToTop(): void {
    const reducedMotion = matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  }
}
