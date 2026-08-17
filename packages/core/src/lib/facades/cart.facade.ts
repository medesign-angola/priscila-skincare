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
  private synchronizedToken: string | null = null;
  private synchronization: Promise<boolean> | null = null;

  readonly items = signal<CartItem[]>(this.readLocal());
  readonly bundles = signal<Array<{ apiId?:string; id:string; type:'kit'|'collection'; name:string; image:string; productCount:number; quantity:number; prices:{AOA:number;EUR:number} }>>(this.readBundles());
  readonly loading = signal(false);
  readonly errorCode = signal<string | null>(null);
  readonly totalUnits = computed(() => this.items().reduce((total, item) => total + item.quantity, 0) + this.bundles().reduce((total,item)=>total+item.quantity,0));
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
  }), this.bundles().reduce((totals,item)=>({AOA:totals.AOA+item.prices.AOA*item.quantity,EUR:totals.EUR+item.prices.EUR*item.quantity}),{AOA:0,EUR:0})));

  constructor() {
    effect(() => { if (this.browser) localStorage.setItem('psc_cart', JSON.stringify(this.items())); });
    effect(() => { if (this.browser) localStorage.setItem('psc_bundle_cart', JSON.stringify(this.bundles())); });
  }

  addBundle(bundle:{id:string;type:'kit'|'collection';name:string;image:string;productCount:number;prices:{AOA:number;EUR:number}}):void{this.bundles.update(items=>{const current=items.find(item=>item.id===bundle.id&&item.type===bundle.type);return current?items.map(item=>item===current?{...item,quantity:Math.min(99,item.quantity+1)}:item):[...items,{...bundle,quantity:1}];});this.markUnsynchronized();void this.synchronize();}
  removeBundle(id:string,type:'kit'|'collection'):void{const item=this.bundles().find(candidate=>candidate.id===id&&candidate.type===type);this.bundles.update(items=>items.filter(candidate=>candidate!==item));if(item?.apiId&&this.session.hasUsableAccessToken())void this.request('delete',`/cart/items/${item.apiId}`);else{this.markUnsynchronized();void this.synchronize();}}
  incrementBundle(id:string,type:'kit'|'collection'):void{this.changeBundle(id,type,1);}
  decrementBundle(id:string,type:'kit'|'collection'):void{this.changeBundle(id,type,-1);}
  private changeBundle(id:string,type:'kit'|'collection',delta:number):void{const current=this.bundles().find(item=>item.id===id&&item.type===type);if(!current)return;if(current.quantity+delta<=0){this.removeBundle(id,type);return;}this.bundles.update(items=>items.map(item=>item===current?{...item,quantity:item.quantity+delta}:item));}

  async synchronize(): Promise<boolean> {
    if (!this.session.hasUsableAccessToken()) return false;
    const token = this.session.accessToken();
    if (this.synchronized && this.synchronizedToken === token) return true;
    if (this.synchronization) return this.synchronization;
    this.synchronization = this.performSynchronization(token);
    try { return await this.synchronization; }
    finally { this.synchronization = null; }
  }

  private async performSynchronization(token: string | null): Promise<boolean> {
    this.loading.set(true);
    try {
      const local = this.items().flatMap(item => {
        if (item.productSku) return [item];
        const product = this.products.mappedProducts().get(item.productId);
        return product ? [{ ...item, productSku: product.sku }] : [];
      });
      if (local.length !== this.items().length || local.some((item, index) => item.productSku !== this.items()[index]?.productSku)) this.items.set(local);
      const mergeItems = [...local.map(item => ({ itemType:'product', reference:item.productSku, variantId:item.sizeId||null, variantLabel:item.sizeLabel, quantity:item.quantity })),...this.bundles().map(item=>({itemType:item.type,reference:item.id,variantId:null,variantLabel:null,quantity:item.quantity}))];
      const response = mergeItems.length
        ? await firstValueFrom(this.http.post<ApiCart>(`${this.config.baseUrl}/cart/merge`, { items: mergeItems }))
        : await firstValueFrom(this.http.get<ApiCart>(`${this.config.baseUrl}/cart`));
      this.applyApi(response); this.synchronized = true; this.synchronizedToken = token; this.errorCode.set(null);
      return true;
    } catch { this.markUnsynchronized(); this.errorCode.set('cart_sync_failed'); return false; }
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
    this.markUnsynchronized();
    void this.synchronize();
  }

  remove(productId: string, sizeId: string): void {
    const item = this.items().find(candidate => candidate.productId === productId && candidate.sizeId === sizeId);
    this.items.update(items => items.filter(candidate => candidate !== item));
    if (item?.id && this.session.hasUsableAccessToken()) void this.request('delete', `/cart/items/${item.id}`);
    else { this.markUnsynchronized(); void this.synchronize(); }
  }
  increment(productId: string, sizeId: string): void { this.changeQuantity(productId, sizeId, 1); }
  decrement(productId: string, sizeId: string): void { this.changeQuantity(productId, sizeId, -1); }
  async clear(): Promise<void> { this.items.set([]); this.bundles.set([]); if (this.session.hasUsableAccessToken()) await firstValueFrom(this.http.delete(`${this.config.baseUrl}/cart`)); }

  private changeQuantity(productId: string, sizeId: string, difference: number): void {
    const current = this.items().find(item => item.productId === productId && item.sizeId === sizeId);
    if (!current) return;
    const quantity = current.quantity + difference;
    if (quantity <= 0) { this.remove(productId, sizeId); return; }
    this.items.update(items => items.map(item => item === current ? { ...item, quantity } : item));
    if (current.id && this.session.hasUsableAccessToken()) void this.request('put', `/cart/items/${current.id}`, { quantity });
    else { this.markUnsynchronized(); void this.synchronize(); }
  }
  private async request(method: 'post'|'put'|'delete', path: string, body?: unknown): Promise<void> {
    try {
      const call = method === 'post' ? this.http.post<ApiCart>(`${this.config.baseUrl}${path}`, body) : method === 'put' ? this.http.put<ApiCart>(`${this.config.baseUrl}${path}`, body) : this.http.delete<ApiCart>(`${this.config.baseUrl}${path}`);
      const result = await firstValueFrom(call); if (result) { this.applyApi(result); this.synchronized = true; this.synchronizedToken = this.session.accessToken(); }
    } catch { this.markUnsynchronized(); this.errorCode.set('cart_update_failed'); }
  }
  private markUnsynchronized(): void { this.synchronized = false; this.synchronizedToken = null; }
  private applyApi(cart: ApiCart): void {
    const bySku = new Map(this.products.products().map(product => [product.sku, product]));
    const products=cart.items.filter(item=>(item.itemType??'product')==='product');
    this.items.set(products.map(item => {
      const sku = item.reference ?? item.productSku;
      return {
        id: item.id,
        productSku: sku,
        productId: bySku.get(sku)?.id ?? sku,
        sizeId: item.variantId ?? '',
        sizeLabel: item.variantLabel ?? undefined,
        quantity: item.quantity,
        available: item.isAvailable,
        stock: item.stock,
      };
    }));
    this.bundles.set(cart.items.filter(item=>item.itemType==='kit'||item.itemType==='collection').map(item=>({apiId:item.id,id:item.reference,type:item.itemType as 'kit'|'collection',name:item.productName,image:item.imageUrl??'',productCount:0,quantity:item.quantity,prices:{AOA:item.aoaPrice,EUR:item.eurPrice}})));
  }
  private readLocal(): CartItem[] {
    if (!this.browser) return [];
    try { return JSON.parse(localStorage.getItem('psc_cart') ?? '[]') as CartItem[]; } catch { return []; }
  }
  private readBundles():Array<{apiId?:string;id:string;type:'kit'|'collection';name:string;image:string;productCount:number;quantity:number;prices:{AOA:number;EUR:number}}>{if(!this.browser)return [];try{return JSON.parse(localStorage.getItem('psc_bundle_cart')??'[]');}catch{return [];}}
}
