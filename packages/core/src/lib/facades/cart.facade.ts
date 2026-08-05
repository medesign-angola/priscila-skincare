import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ProductFacade } from './product.facade';
import { ApiCart, CartItem } from '../models/cart.interface';
import { API_CONFIG } from '../config/api.config';
import { AuthSessionStore } from '../services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly products = inject(ProductFacade);
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly session = inject(AuthSessionStore);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private synchronized = false;

  readonly items = signal<CartItem[]>(this.readLocal());
  readonly loading = signal(false);
  readonly errorCode = signal<string | null>(null);
  readonly totalUnits = computed(() => this.items().reduce((total, item) => total + item.quantity, 0));
  readonly resolvedItems = computed(() => {
    const bySku = new Map(this.products.products().map(product => [product.sku, product]));
    const sizes = new Map(this.products.sizes().map(size => [size.id, size]));
    return this.items().flatMap(item => {
      const product = bySku.get(item.productSku) ?? this.products.mappedProducts().get(item.productId);
      return product ? [{ ...item, product, size: sizes.get(item.sizeId) }] : [];
    });
  });
  readonly subtotal = computed(() => this.resolvedItems().reduce((totals, item) => ({
    AOA: totals.AOA + (item.product.commerce?.prices.AOA ?? 0) * item.quantity,
    EUR: totals.EUR + (item.product.commerce?.prices.EUR ?? 0) * item.quantity,
  }), { AOA: 0, EUR: 0 }));

  constructor() {
    effect(() => { if (this.browser) localStorage.setItem('psc_cart', JSON.stringify(this.items())); });
  }

  async synchronize(): Promise<void> {
    if (!this.session.hasUsableAccessToken() || this.synchronized) return;
    this.loading.set(true);
    try {
      const local = this.items().flatMap(item => {
        if (item.productSku) return [item];
        const product = this.products.mappedProducts().get(item.productId);
        return product ? [{ ...item, productSku: product.sku }] : [];
      });
      if (local.length !== this.items().length || local.some((item, index) => item.productSku !== this.items()[index]?.productSku)) this.items.set(local);
      const response = local.length
        ? await firstValueFrom(this.http.post<ApiCart>(`${this.config.baseUrl}/cart/merge`, { items: local.map(item => ({ productSku: item.productSku, variantId: item.sizeId || null, variantLabel: item.sizeLabel, quantity: item.quantity })) }))
        : await firstValueFrom(this.http.get<ApiCart>(`${this.config.baseUrl}/cart`));
      this.applyApi(response); this.synchronized = true; this.errorCode.set(null);
    } catch { this.errorCode.set('cart_sync_failed'); }
    finally { this.loading.set(false); }
  }

  add(productId: string, sizeId?: string): void {
    const product = this.products.mappedProducts().get(productId);
    const resolvedSizeId = sizeId ?? product?.sizeIds.at(0) ?? '';
    if (!product) return;
    const size = this.products.sizes().find(candidate => candidate.id === resolvedSizeId);
    this.items.update(items => {
      const existing = items.find(item => item.productSku === product.sku && item.sizeId === resolvedSizeId);
      return existing ? items.map(item => item === existing ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item)
        : [...items, { productId, productSku: product.sku, sizeId: resolvedSizeId, sizeLabel: size?.value, quantity: 1 }];
    });
    void this.pushAdd(product.sku, resolvedSizeId, size?.value);
  }

  remove(productId: string, sizeId: string): void {
    const item = this.items().find(candidate => candidate.productId === productId && candidate.sizeId === sizeId);
    this.items.update(items => items.filter(candidate => candidate !== item));
    if (item?.id && this.session.hasUsableAccessToken()) void this.request('delete', `/cart/items/${item.id}`);
  }
  increment(productId: string, sizeId: string): void { this.changeQuantity(productId, sizeId, 1); }
  decrement(productId: string, sizeId: string): void { this.changeQuantity(productId, sizeId, -1); }
  async clear(): Promise<void> { this.items.set([]); if (this.session.hasUsableAccessToken()) await firstValueFrom(this.http.delete(`${this.config.baseUrl}/cart`)); }

  private changeQuantity(productId: string, sizeId: string, difference: number): void {
    const current = this.items().find(item => item.productId === productId && item.sizeId === sizeId);
    if (!current) return;
    const quantity = current.quantity + difference;
    if (quantity <= 0) { this.remove(productId, sizeId); return; }
    this.items.update(items => items.map(item => item === current ? { ...item, quantity } : item));
    if (current.id && this.session.hasUsableAccessToken()) void this.request('put', `/cart/items/${current.id}`, { quantity });
  }

  private async pushAdd(productSku: string, variantId: string, variantLabel?: string): Promise<void> {
    if (!this.session.hasUsableAccessToken()) return;
    await this.request('post', '/cart/items', { productSku, variantId: variantId || null, variantLabel, quantity: 1 });
  }
  private async request(method: 'post'|'put'|'delete', path: string, body?: unknown): Promise<void> {
    try {
      const call = method === 'post' ? this.http.post<ApiCart>(`${this.config.baseUrl}${path}`, body) : method === 'put' ? this.http.put<ApiCart>(`${this.config.baseUrl}${path}`, body) : this.http.delete<ApiCart>(`${this.config.baseUrl}${path}`);
      const result = await firstValueFrom(call); if (result) this.applyApi(result);
    } catch { this.errorCode.set('cart_update_failed'); }
  }
  private applyApi(cart: ApiCart): void {
    const bySku = new Map(this.products.products().map(product => [product.sku, product]));
    this.items.set(cart.items.map(item => ({ id: item.id, productSku: item.productSku,
      productId: bySku.get(item.productSku)?.id ?? item.productSku, sizeId: item.variantId ?? '', sizeLabel: item.variantLabel ?? undefined,
      quantity: item.quantity, available: item.isAvailable, stock: item.stock })));
  }
  private readLocal(): CartItem[] {
    if (!this.browser) return [];
    try { return JSON.parse(localStorage.getItem('psc_cart') ?? '[]') as CartItem[]; } catch { return []; }
  }
}
