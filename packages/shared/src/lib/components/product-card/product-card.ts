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
  imageUrl: string;
  rating: number;
  totalReviews: number;
  currencyLabel: string;
  priceLabel: string;
  available: boolean;
  badge?: ProductCardBadge;
}

@Component({
  selector: 'org-product-card',
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<ProductCardData>();
  readonly productSelect = output<string>();
  readonly addToCart = output<string>();

  selectProduct(): void {
    this.productSelect.emit(this.product().id);
  }

  requestAddToCart(): void {
    if (this.product().available) {
      this.addToCart.emit(this.product().id);
    }
  }
}
