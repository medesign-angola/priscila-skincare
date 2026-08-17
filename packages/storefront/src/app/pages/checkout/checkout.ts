import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade, CartFacade, CheckoutPreview, HeaderService, ProductFacade } from '@org/core';
import { formatPrice } from '@org/shared';

@Component({ selector:'app-checkout', imports:[RouterLink,TranslatePipe], templateUrl:'./checkout.html', styleUrl:'./checkout.css', changeDetection:ChangeDetectionStrategy.OnPush })
export class Checkout {
  readonly auth=inject(AuthFacade); readonly cart=inject(CartFacade); private readonly header=inject(HeaderService);
  private readonly products=inject(ProductFacade); private readonly router=inject(Router);
  readonly selectedAddressId=signal(this.auth.customer()?.addresses.find(x=>x.isDefault)?.id ?? this.auth.customer()?.addresses[0]?.id ?? '');
  readonly preview=signal<CheckoutPreview|null>(null); readonly loading=signal(false); readonly errorCode=signal<string|null>(null);
  readonly errorMessageKey=computed(()=>this.errorCode()==='cart_sync_failed'?'CHECKOUT.CART_SYNC_ERROR':this.errorCode()==='create_failed'?'CHECKOUT.CREATE_ERROR':'CHECKOUT.PREVIEW_ERROR');
  private readonly checkoutAttemptId=signal<string|null>(null);
  readonly addresses=computed(()=>this.auth.customer()?.addresses??[]);
  constructor(){const previous=this.header.theme();this.header.theme.set('black');inject(DestroyRef).onDestroy(()=>this.header.theme.set(previous));if(this.selectedAddressId())void this.refresh();}
  select(id:string){this.selectedAddressId.set(id);this.checkoutAttemptId.set(null);void this.refresh();}
  async refresh(){if(!this.selectedAddressId())return;this.loading.set(true);this.preview.set(null);try{if(!(await this.cart.synchronize())){this.errorCode.set('cart_sync_failed');return;}this.preview.set(await this.auth.checkoutPreview(this.selectedAddressId(),this.header.currency(),this.products.currentLanguage()));this.errorCode.set(null);}catch{this.errorCode.set('preview_failed');}finally{this.loading.set(false);}}
  async confirm(){if(!this.selectedAddressId()||this.loading())return;this.loading.set(true);try{const key=this.checkoutAttemptId()??crypto.randomUUID();this.checkoutAttemptId.set(key);const order=await this.auth.createOrder(this.selectedAddressId(),this.header.currency(),this.products.currentLanguage(),key);await this.cart.clear();this.checkoutAttemptId.set(null);await this.router.navigate(['/conta/encomendas',order.id]);}catch{this.errorCode.set('create_failed');}finally{this.loading.set(false);}}
  price(value:number){return formatPrice(value,this.preview()?.currency??this.header.currency(),this.products.currentLanguage(),true);}
}
