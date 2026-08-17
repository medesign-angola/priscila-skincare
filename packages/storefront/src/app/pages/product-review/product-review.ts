import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  AuthFacade,
  HeaderService,
  ProductFacade,
  ReviewFacade,
} from '@org/core';
import { formatPrice } from '@org/shared';
import { map } from 'rxjs';

@Component({
  selector: 'app-product-review',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, UpperCasePipe, NgTemplateOutlet],
  templateUrl: './product-review.html',
  styleUrl: './product-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductReview {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly header = inject(HeaderService);
  private readonly destroyRef = inject(DestroyRef);
  readonly reviewFacade = inject(ReviewFacade);

  readonly auth = inject(AuthFacade);
  readonly products = inject(ProductFacade);
  readonly submitting = signal(false);
  readonly hoveredRating = signal(0);
  readonly productIdentifier = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('productId'))),
    { initialValue: null },
  );
  readonly generic = this.route.snapshot.data['genericReview'] === true;
  readonly product = computed(() => {
    const identifier = this.productIdentifier();
    return (
      this.products
        .products()
        .find(
          (product) => product.id === identifier || product.slug === identifier,
        ) ?? null
    );
  });
  readonly existingReview = computed(() => {
    const product = this.product();
    return product ? this.reviewFacade.reviewForCustomer(product.sku) : undefined;
  });
  readonly price = computed(() => {
    const commerce = this.product()?.commerce;
    if (!commerce) return '';
    const currency = this.header.currency();
    return formatPrice(
      commerce.prices[currency],
      currency,
      this.products.currentLanguage(),
      true,
    );
  });
  readonly form = new FormGroup({
    rating: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000),
      ],
    }),
    recommends: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    const previousTheme = this.header.theme();
    this.header.theme.set('black');
    this.destroyRef.onDestroy(() => this.header.theme.set(previousTheme));

    effect(() => {
      const product = this.product();
      if (product) void this.reviewFacade.load(product.sku, true);
    });

    effect(() => {
      const review = this.existingReview();
      if (!review) return;
      this.form.setValue(
        {
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          recommends: review.recommends,
        },
        { emitEvent: false },
      );
    });
  }

  setRating(rating: number): void {
    this.form.controls.rating.setValue(rating);
    this.form.controls.rating.markAsTouched();
  }

  ratingLabelKey(): string {
    return `PRODUCT_REVIEW.RATING.${this.form.controls.rating.value || 'EMPTY'}`;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const product = this.product();
    if ((!product && !this.generic) || !this.auth.customer() || this.submitting()) return;

    this.submitting.set(true);
    try {
      await this.reviewFacade.submit({
        productSku: product?.sku,
        locale: this.products.currentLanguage(),
        ...this.form.getRawValue(),
      });
      await this.router.navigate(this.generic ? ['/avaliacao-enviada'] : ['/produtos', product!.slug ?? product!.id, 'avaliacao-enviada']);
    } catch {
      // A fachada mantém o código de erro traduzível apresentado no template.
    } finally {
      this.submitting.set(false);
    }
  }
}
