import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgxMaskDirective } from 'ngx-mask';
import { AuthFacade, CartFacade, CheckoutPreview, HeaderService, internationalPhone, localPhoneValue, PHONE_COUNTRIES, phoneCountry, ProductFacade, SaveCustomerAddress } from '@org/core';
import { formatPrice } from '@org/shared';

@Component({ selector:'app-checkout', imports:[RouterLink,TranslatePipe,ReactiveFormsModule,NgxMaskDirective], templateUrl:'./checkout.html', styleUrl:'./checkout.css', changeDetection:ChangeDetectionStrategy.OnPush })
export class Checkout {
  readonly auth=inject(AuthFacade); readonly cart=inject(CartFacade); private readonly header=inject(HeaderService);
  private readonly products=inject(ProductFacade); private readonly router=inject(Router);
  readonly selectedAddressId=signal(this.auth.customer()?.addresses.find(x=>x.isDefault)?.id ?? this.auth.customer()?.addresses[0]?.id ?? '');
  readonly preview=signal<CheckoutPreview|null>(null); readonly loading=signal(false); readonly errorCode=signal<string|null>(null);
  readonly summary=computed(()=>{
    const preview=this.preview();
    if(preview)return{items:preview.items.map(item=>({name:item.productName,variant:item.variant,quantity:item.quantity,total:item.total,imageUrl:item.imageUrl})),subtotal:preview.subtotal,shipping:preview.shipping,total:preview.total,complete:true};
    const cart=this.cart.syncedCart();
    if(!cart)return null;
    const currency=this.header.currency();
    const items=cart.items.map(item=>{const unitPrice=currency==='AOA'?item.aoaPrice:item.eurPrice;return{name:item.productName,variant:item.variantLabel??undefined,quantity:item.quantity,total:unitPrice*item.quantity,imageUrl:item.imageUrl??undefined};});
    return{items,subtotal:currency==='AOA'?cart.aoaSubtotal:cart.eurSubtotal,shipping:null,total:null,complete:false};
  });
  readonly errorMessageKey=computed(()=>this.errorCode()==='cart_sync_failed'?'CHECKOUT.CART_SYNC_ERROR':this.errorCode()==='create_failed'?'CHECKOUT.CREATE_ERROR':'CHECKOUT.PREVIEW_ERROR');
  private readonly checkoutAttemptId=signal<string|null>(null);
  readonly addresses=computed(()=>this.auth.customer()?.addresses??[]);
  readonly countries=PHONE_COUNTRIES;
  readonly addressModalOpen=signal(false); readonly addressSaving=signal(false); readonly addressError=signal(false);
  readonly addressForm=new FormGroup({
    label:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(60)]}),
    recipient:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(160)]}),
    phone:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
    country:new FormControl('Angola',{nonNullable:true,validators:[Validators.required]}),
    province:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
    city:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
    neighborhood:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
    street:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
    houseNumber:new FormControl('',{nonNullable:true}), apartment:new FormControl('',{nonNullable:true}), postalCode:new FormControl('',{nonNullable:true}),
    isDefault:new FormControl(false,{nonNullable:true}),
  });
  private readonly document=inject(DOCUMENT);
  constructor(){
    const countrySubscription = this.addressForm.controls.country.valueChanges.subscribe(country => {
      const postal = this.addressForm.controls.postalCode;
      if (country === 'Angola' && !postal.value) postal.setValue('0000');
      else if (country !== 'Angola' && postal.value === '0000') postal.setValue('');
    });
    inject(DestroyRef).onDestroy(() => countrySubscription.unsubscribe());
    const previous=this.header.theme();this.header.theme.set('black');inject(DestroyRef).onDestroy(()=>this.header.theme.set(previous));
    effect(()=>{const addresses=this.addresses();if(!this.selectedAddressId()&&addresses.length){this.selectedAddressId.set(addresses.find(item=>item.isDefault)?.id??addresses[0].id);void this.refresh();}});
    effect((onCleanup)=>{if(!this.addressModalOpen())return;const body=this.document.body;const overflow=body.style.overflow;body.style.overflow='hidden';onCleanup(()=>body.style.overflow=overflow);});
    void this.refresh();
  }
  select(id:string){this.selectedAddressId.set(id);this.checkoutAttemptId.set(null);void this.refresh();}
  async refresh(){this.loading.set(true);this.preview.set(null);try{if(!(await this.cart.synchronize())){this.errorCode.set('cart_sync_failed');return;}if(this.selectedAddressId())this.preview.set(await this.auth.checkoutPreview(this.selectedAddressId(),this.header.currency(),this.products.currentLanguage()));this.errorCode.set(null);}catch{this.errorCode.set('preview_failed');}finally{this.loading.set(false);}}
  async confirm(){if(!this.selectedAddressId()||this.loading())return;this.loading.set(true);try{const key=this.checkoutAttemptId()??crypto.randomUUID();this.checkoutAttemptId.set(key);const order=await this.auth.createOrder(this.selectedAddressId(),this.header.currency(),this.products.currentLanguage(),key);await this.cart.clear();this.checkoutAttemptId.set(null);await this.router.navigate(['/conta/encomendas',order.id]);}catch{this.errorCode.set('create_failed');}finally{this.loading.set(false);}}
  price(value:number){return formatPrice(value,this.preview()?.currency??this.header.currency(),this.products.currentLanguage(),true);}
  phoneMask(){return phoneCountry(this.addressForm.controls.country.value).mask;}
  phonePrefix(){return `${phoneCountry(this.addressForm.controls.country.value).dialCode} `;}
  openAddressModal(){this.addressError.set(false);this.addressForm.reset({label:'',recipient:this.auth.customer()?.name??'',phone:localPhoneValue(this.auth.customer()?.phone,'Angola'),country:'Angola',province:'',city:'',neighborhood:'',street:'',houseNumber:'',apartment:'',postalCode:'0000',isDefault:this.addresses().length===0});this.addressModalOpen.set(true);}
  closeAddressModal(){if(!this.addressSaving())this.addressModalOpen.set(false);}
  @HostListener('document:keydown.escape') closeOnEscape(){if(this.addressModalOpen())this.closeAddressModal();}
  async saveAddress(){if(this.addressForm.invalid||this.addressSaving()){this.addressForm.markAllAsTouched();return;}this.addressSaving.set(true);this.addressError.set(false);const raw=this.addressForm.getRawValue();const payload:SaveCustomerAddress={...raw,phone:internationalPhone(raw.phone,raw.country),houseNumber:raw.houseNumber.trim()||undefined,apartment:raw.apartment.trim()||undefined,postalCode:raw.postalCode.trim()||undefined};try{const created=await this.auth.createAddress(payload);this.selectedAddressId.set(created.id);this.checkoutAttemptId.set(null);this.addressModalOpen.set(false);await this.refresh();}catch{this.addressError.set(true);}finally{this.addressSaving.set(false);}}
}
