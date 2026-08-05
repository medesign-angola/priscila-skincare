import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Order, ProductFacade } from '@org/core';
import { formatPrice } from '@org/shared';

@Component({selector:'app-order-card',imports:[DatePipe,RouterLink,TranslatePipe],templateUrl:'./order-card.html',styleUrl:'./order-card.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class OrderCard {
  readonly order=input.required<Order>(); readonly products=inject(ProductFacade);
  readonly items=computed(()=>this.order().items.map(item=>({item,product:this.products.products().find(product=>product.sku===item.productSku)})));
  total():number{return this.order().total;}
  price(value:number):string{return formatPrice(value,this.order().currency,this.products.currentLanguage(),true);}
}
