import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  readonly addresses=computed(()=>this.auth.customer()?.addresses??[]);
  constructor(){ if(this.selectedAddressId()) void this.refresh(); }
  select(id:string){this.selectedAddressId.set(id);void this.refresh();}
  async refresh(){if(!this.selectedAddressId())return;this.loading.set(true);try{this.preview.set(await this.auth.checkoutPreview(this.selectedAddressId(),this.header.currency(),this.products.currentLanguage()));this.errorCode.set(null);}catch{this.errorCode.set('preview_failed');}finally{this.loading.set(false);}}
  async confirm(){if(!this.selectedAddressId()||this.loading())return;this.loading.set(true);try{const key=crypto.randomUUID();const order=await this.auth.createOrder(this.selectedAddressId(),this.header.currency(),this.products.currentLanguage(),key);await this.cart.clear();await this.router.navigate(['/conta/encomendas',order.id]);}catch{this.errorCode.set('create_failed');}finally{this.loading.set(false);}}
  price(value:number){return formatPrice(value,this.preview()?.currency??this.header.currency(),this.products.currentLanguage(),true);}
}
