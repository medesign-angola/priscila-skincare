import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HeaderService } from '@org/core';

@Component({
  selector: 'app-product-review-success',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './product-review-success.html',
  styleUrl: './product-review-success.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductReviewSuccess {
  private readonly header = inject(HeaderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  readonly productId = this.route.snapshot.paramMap.get('productId') ?? '';

  constructor() {
    const previousTheme = this.header.theme();
    this.header.theme.set('black');
    this.destroyRef.onDestroy(() => this.header.theme.set(previousTheme));
  }
}
