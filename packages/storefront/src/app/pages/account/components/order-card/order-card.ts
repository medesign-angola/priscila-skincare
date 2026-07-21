import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HeaderService, Order, ProductFacade } from '@org/core';
import { formatPrice } from '@org/shared';

@Component({selector:'app-order-card',imports:[DatePipe,RouterLink,TranslatePipe],templateUrl:'./order-card.html',styleUrl:'./order-card.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class OrderCard {
  readonly order=input.required<Order>(); readonly products=inject(ProductFacade); private readonly header=inject(HeaderService);
  readonly items=computed(()=>this.order().items.map(item=>({item,product:this.products.mappedProducts().get(item.productId)})));
  total():number{return this.order().items.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0)+this.order().shippingPrice;}
  price(value:number):string{const currency=this.header.currency();return formatPrice(value,currency,this.products.currentLanguage(),true);}
}
