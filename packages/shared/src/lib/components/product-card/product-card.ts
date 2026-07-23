import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type ProductCardBadge =
  | { type: 'discount'; percentage: number }
  | { type: 'new' }
  | { type: 'coming-soon' };

export interface ProductCardData {
  id: string;
  name: string;
  description: string;
  categoryLabel?: string;
  imageUrl: string;
  rating: number;
  totalReviews: number;
  currencyLabel: string;
  priceLabel: string;
  available: boolean;
  addedToCart?: boolean;
  badge?: ProductCardBadge;
}

@Component({
  selector: 'org-product-card',
  host: {
    '[class.product-card--related]': "variant() === 'related'",
  },
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<ProductCardData>();
  readonly variant = input<'default' | 'related'>('default');
  readonly productSelect = output<string>();
  readonly addToCart = output<string>();

  selectProduct(): void {
    this.productSelect.emit(this.product().id);
  }

  requestAddToCart(): void {
    if (this.product().available && !this.product().addedToCart) {
      this.addToCart.emit(this.product().id);
    }
  }
}
