import { computed, inject, Injectable, signal } from '@angular/core';
import { ProductFacade } from './product.facade';
import { CartItem } from '../models/cart.interface';

@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly productFacade = inject(ProductFacade);

  readonly items = signal<CartItem[]>([]);
  readonly totalUnits = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0),
  );
  readonly resolvedItems = computed(() => {
    const products = this.productFacade.mappedProducts();
    const sizes = new Map(
      this.productFacade.sizes().map((size) => [size.id, size]),
    );

    return this.items().flatMap((item) => {
      const product = products.get(item.productId);
      if (!product) return [];

      return [{ ...item, product, size: sizes.get(item.sizeId) }];
    });
  });
  readonly subtotal = computed(() =>
    this.resolvedItems().reduce(
      (totals, item) => ({
        AOA:
          totals.AOA +
          (item.product.commerce?.prices.AOA ?? 0) * item.quantity,
        EUR:
          totals.EUR +
          (item.product.commerce?.prices.EUR ?? 0) * item.quantity,
      }),
      { AOA: 0, EUR: 0 },
    ),
  );

  add(productId: string, sizeId?: string): void {
    const product = this.productFacade.mappedProducts().get(productId);
    const resolvedSizeId = sizeId ?? product?.sizeIds.at(0);
    if (!product || !resolvedSizeId) return;

    this.items.update((items) => {
      const existingItem = items.find(
        (item) =>
          item.productId === productId && item.sizeId === resolvedSizeId,
      );

      return existingItem
        ? items.map((item) =>
            item === existingItem
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...items, { productId, sizeId: resolvedSizeId, quantity: 1 }];
    });
  }

  remove(productId: string, sizeId: string): void {
    this.items.update((items) =>
      items.filter(
        (item) => item.productId !== productId || item.sizeId !== sizeId,
      ),
    );
  }

  increment(productId: string, sizeId: string): void {
    this.changeQuantity(productId, sizeId, 1);
  }

  decrement(productId: string, sizeId: string): void {
    const item = this.items().find(
      (candidate) =>
        candidate.productId === productId && candidate.sizeId === sizeId,
    );
    if (!item) return;
    if (item.quantity === 1) {
      this.remove(productId, sizeId);
      return;
    }

    this.changeQuantity(productId, sizeId, -1);
  }

  private changeQuantity(
    productId: string,
    sizeId: string,
    difference: number,
  ): void {
    this.items.update((items) =>
      items.map((item) =>
        item.productId === productId && item.sizeId === sizeId
          ? { ...item, quantity: item.quantity + difference }
          : item,
      ),
    );
  }
}
