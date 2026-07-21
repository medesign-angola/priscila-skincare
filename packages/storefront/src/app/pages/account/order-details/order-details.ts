import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade, HeaderService, ProductFacade } from '@org/core';
import { formatPrice } from '@org/shared';

@Component({selector:'app-order-details',imports:[DatePipe,RouterLink,TranslatePipe],templateUrl:'./order-details.html',styleUrl:'./order-details.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class OrderDetails {
  private readonly route=inject(ActivatedRoute); readonly auth=inject(AuthFacade); readonly products=inject(ProductFacade); private readonly header=inject(HeaderService);
  readonly order=computed(()=>this.auth.orderById(this.route.snapshot.paramMap.get('orderId')??''));
  readonly items=computed(()=>(this.order()?.items??[]).map(item=>({item,product:this.products.mappedProducts().get(item.productId)})));
  subtotal():number{return this.order()?.items.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0)??0;}
  price(value:number):string{const currency=this.header.currency();return formatPrice(value,currency,this.products.currentLanguage(),true);}
}
