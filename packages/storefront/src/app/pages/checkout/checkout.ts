import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgxMaskDirective } from 'ngx-mask';
import { debounceTime, distinctUntilChanged, map, merge } from 'rxjs';
import { AuthFacade, CartFacade, CheckoutPreview, HeaderService, internationalPhone, localPhoneValue, PHONE_COUNTRIES, phoneCountry, ProductFacade, SaveCustomerAddress, PickupLocation } from '@org/core';
import { formatPrice } from '@org/shared';

@Component({ selector:'app-checkout', imports:[RouterLink,TranslatePipe,ReactiveFormsModule,NgxMaskDirective], templateUrl:'./checkout.html', styleUrl:'./checkout.css', changeDetection:ChangeDetectionStrategy.OnPush })
export class Checkout {
  readonly auth=inject(AuthFacade); readonly cart=inject(CartFacade); private readonly header=inject(HeaderService);
  private readonly products=inject(ProductFacade); private readonly router=inject(Router);
  readonly selectedAddressId=signal(this.auth.customer()?.addresses.find(x=>x.isDefault)?.id ?? this.auth.customer()?.addresses[0]?.id ?? '');
  readonly preview=signal<CheckoutPreview|null>(null); readonly loading=signal(false); readonly errorCode=signal<string|null>(null);
  readonly couponInput = new FormControl('', { nonNullable: true });
  readonly coupon = signal(''); readonly deliveryRateId = signal<string | undefined>(undefined);
  readonly pickupLocations = signal<PickupLocation[]>([]);
  readonly pickupLocationId = signal<string | undefined>(undefined);
  readonly pickupLocation = computed(()=>this.pickupLocations().find(x=>x.id===this.pickupLocationId()));
  readonly pickupName = new FormControl(this.auth.customer()?.name ?? '', {nonNullable:true, validators:[Validators.required,Validators.maxLength(160)]});
  readonly pickupPhone = new FormControl(localPhoneValue(this.auth.customer()?.phone, phoneCountry(this.auth.customer()?.phone).country), {nonNullable:true, validators:[Validators.required]});
  readonly contactCountry = new FormControl(phoneCountry(this.auth.customer()?.phone).country, {nonNullable:true});
  pickupContact(){return {name:this.pickupName.value.trim(),phone:internationalPhone(this.pickupPhone.value,this.contactCountry.value)};}
  pickupPhoneMask(){return phoneCountry(this.contactCountry.value).mask;}
  pickupPhonePrefix(){return `${phoneCountry(this.contactCountry.value).dialCode} `;}
  checkoutAddressId(){return this.pickupLocationId()?'00000000-0000-0000-0000-000000000000':this.selectedAddressId();}
  pickupContactValid(){return !!this.pickupName.value.trim() && this.pickupName.valid && this.pickupPhone.valid && this.pickupPhone.value.replace(/\D/g, '').length === phoneCountry(this.contactCountry.value).localDigits;}
  contactChanged(){++this.refreshSequence;this.preview.set(null);this.checkoutAttemptId.set(null);if(this.pickupContactValid() && this.errorCode()==='contact_required')this.errorCode.set(null);}
  private refreshSequence = 0;
  readonly summary=computed(()=>{
    const preview=this.preview();
    if(preview)return{items:preview.items.map(item=>({components:item.components,itemType:item.itemType??'product',name:item.productName,variant:item.variant,quantity:item.quantity,total:item.total,imageUrl:item.imageUrl})),subtotal:preview.subtotal,shipping:preview.shipping,total:preview.total,complete:true};
    const cart=this.cart.syncedCart();
    if(!cart)return null;
    const currency=this.header.currency();
    const items=cart.items.map(item=>{const unitPrice=currency==='AOA'?item.aoaPrice:item.eurPrice;return{components:undefined,itemType:item.itemType??'product',name:item.productName,variant:item.variantLabel??undefined,quantity:item.quantity,total:unitPrice*item.quantity,imageUrl:item.imageUrl??undefined};});
    return{items,subtotal:currency==='AOA'?cart.aoaSubtotal:cart.eurSubtotal,shipping:null,total:null,complete:false};
  });
  readonly errorMessageKey=computed(()=>{
    const messages: Record<string, string> = {cart_sync_failed:'CHECKOUT.CART_SYNC_ERROR',create_failed:'CHECKOUT.CREATE_ERROR',coupon_unavailable:'CHECKOUT.COUPON_ERROR',delivery_unavailable:'CHECKOUT.DELIVERY_ERROR',pickup_unavailable:'CHECKOUT.PICKUP_ERROR',contact_required:'CHECKOUT.CONTACT_ERROR',checkout_changed:'CHECKOUT.CHANGED'};
    return messages[this.errorCode()??'']??'CHECKOUT.PREVIEW_ERROR';
  });
  private readonly checkoutAttemptId=signal<string|null>(null);
  readonly addresses=computed(()=>this.auth.customer()?.addresses??[]);
  readonly countries=PHONE_COUNTRIES;
  readonly deliveryCountries = signal<string[]>([]);
  readonly countriesLoading = signal(false);
  readonly countriesError = signal(false);
  async loadDeliveryCountries() {
    this.countriesLoading.set(true); this.countriesError.set(false);
    try {
      const values = await this.auth.deliveryCountries();
      this.deliveryCountries.set(values);
      if (!this.addressForm.controls.country.value) this.addressForm.controls.country.setValue(values[0] ?? '');
    } catch { this.countriesError.set(true); }
    finally { this.countriesLoading.set(false); }
  }

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
    const contactSubscription = merge(this.pickupName.valueChanges, this.pickupPhone.valueChanges,
      this.contactCountry.valueChanges, this.pickupName.statusChanges, this.pickupPhone.statusChanges).pipe(
      debounceTime(250),
      map(() => JSON.stringify([this.pickupContact(), this.contactCountry.value, this.pickupContactValid()])),
      distinctUntilChanged(),
    ).subscribe(() => {
      if (!this.pickupLocationId()) return;
      this.contactChanged();
      if (this.pickupContactValid()) void this.refresh();
      else { ++this.refreshSequence; this.loading.set(false); this.errorCode.set('contact_required'); }
    });
    inject(DestroyRef).onDestroy(() => contactSubscription.unsubscribe());
    effect(() => {
      const customer = this.auth.customer();
      if (!customer) return;
      if (this.pickupName.pristine && !this.pickupName.value) this.pickupName.setValue(customer.name ?? '');
      if (this.pickupPhone.pristine && !this.pickupPhone.value && customer.phone) {
        this.contactCountry.setValue(phoneCountry(customer.phone).country);
        this.pickupPhone.setValue(localPhoneValue(customer.phone, this.contactCountry.value));
      }
    });
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
  select(id:string){this.selectedAddressId.set(id);this.deliveryRateId.set(undefined);this.checkoutAttemptId.set(null);void this.refresh();}
  applyCoupon(){this.coupon.set(this.couponInput.value.trim());this.checkoutAttemptId.set(null);void this.refresh();}
  selectDelivery(id:string){this.deliveryRateId.set(id);this.checkoutAttemptId.set(null);void this.refresh();}
  selectPickup(id:string){this.pickupLocationId.set(id||undefined);this.deliveryRateId.set(undefined);this.checkoutAttemptId.set(null);void this.refresh();}
  async refresh(){
    const sequence=++this.refreshSequence;
    this.loading.set(true);this.preview.set(null);
    try {
      if(!(await this.cart.synchronize())){if(sequence===this.refreshSequence)this.errorCode.set('cart_sync_failed');return;}
      const locations=await this.auth.pickupLocations(this.products.currentLanguage());
      if(sequence!==this.refreshSequence)return;
      this.pickupLocations.set(locations);
      if(this.pickupLocationId()&&!locations.some(x=>x.id===this.pickupLocationId())){
        this.pickupLocationId.set(undefined);this.errorCode.set('pickup_unavailable');return;
      }
      if(this.pickupLocationId()&&!this.pickupContactValid()){this.errorCode.set('contact_required');return;}
      const result=this.checkoutAddressId()?await this.auth.checkoutPreview(this.checkoutAddressId(),this.header.currency(),this.products.currentLanguage(),this.coupon()||undefined,this.deliveryRateId(),this.pickupLocationId(),this.pickupLocationId()?this.pickupContact():undefined):null;
      if(sequence!==this.refreshSequence)return;
      this.preview.set(result);this.deliveryRateId.set(result?.deliveryRateId);this.errorCode.set(null);
    } catch (error: any) {if(sequence===this.refreshSequence)this.errorCode.set(['coupon_unavailable','delivery_unavailable','pickup_unavailable'].includes(error?.error?.code)?error.error.code:'preview_failed');}
    finally {if(sequence===this.refreshSequence)this.loading.set(false);}
  }
  async confirm(){
    if(!this.checkoutAddressId()||this.loading()||!this.preview()||(this.pickupLocationId()&&!this.pickupContactValid()))return;
    this.loading.set(true);
    try {
      const key=this.checkoutAttemptId()??crypto.randomUUID();this.checkoutAttemptId.set(key);
      const order=await this.auth.createOrder(this.checkoutAddressId(),this.header.currency(),this.products.currentLanguage(),key,this.coupon()||undefined,this.deliveryRateId(),this.preview()?.total,this.pickupLocationId(),this.pickupLocationId()?this.pickupContact():undefined);
      await this.cart.clear();this.checkoutAttemptId.set(null);await this.router.navigate(['/conta/encomendas',order.id]);
    } catch(error: any) {
      const code=error?.error?.code;
      if(['checkout_changed','coupon_unavailable','delivery_unavailable','pickup_unavailable'].includes(code)) {
        this.checkoutAttemptId.set(null);
        await this.refresh();
        this.errorCode.set(code);
      } else this.errorCode.set('create_failed');
    } finally {this.loading.set(false);}
  }
  price(value:number){return formatPrice(value,this.preview()?.currency??this.header.currency(),this.products.currentLanguage(),true);}
  phoneMask(){return phoneCountry(this.addressForm.controls.country.value).mask;}
  phonePrefix(){return `${phoneCountry(this.addressForm.controls.country.value).dialCode} `;}
  openAddressModal(){this.addressError.set(false);this.addressForm.reset({label:'',recipient:this.auth.customer()?.name??'',phone:localPhoneValue(this.auth.customer()?.phone,'Angola'),country:'',province:'',city:'',neighborhood:'',street:'',houseNumber:'',apartment:'',postalCode:'0000',isDefault:this.addresses().length===0});this.addressModalOpen.set(true);void this.loadDeliveryCountries();}
  closeAddressModal(){if(!this.addressSaving())this.addressModalOpen.set(false);}
  @HostListener('document:keydown.escape') closeOnEscape(){if(this.addressModalOpen())this.closeAddressModal();}
  async saveAddress(){if(this.addressForm.invalid||this.addressSaving()||this.countriesLoading()||this.countriesError()||!this.deliveryCountries().includes(this.addressForm.controls.country.value)){this.addressForm.markAllAsTouched();return;}this.addressSaving.set(true);this.addressError.set(false);const raw=this.addressForm.getRawValue();const payload:SaveCustomerAddress={...raw,phone:internationalPhone(raw.phone,raw.country),houseNumber:raw.houseNumber.trim()||undefined,apartment:raw.apartment.trim()||undefined,postalCode:raw.postalCode.trim()||undefined};try{const created=await this.auth.createAddress(payload);this.selectedAddressId.set(created.id);this.checkoutAttemptId.set(null);this.addressModalOpen.set(false);await this.refresh();}catch{this.addressError.set(true);}finally{this.addressSaving.set(false);}}
}
