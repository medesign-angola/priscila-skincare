import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade, OrderStatus, ProductFacade } from '@org/core';
import { formatPrice } from '@org/shared';

@Component({selector:'app-order-details',imports:[DatePipe,RouterLink,TranslatePipe],templateUrl:'./order-details.html',styleUrl:'./order-details.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class OrderDetails {
  private readonly regularFlow: readonly OrderStatus[] = ['pending','confirmed','paid','processing','shipped','delivered'];
  private readonly route=inject(ActivatedRoute); readonly auth=inject(AuthFacade); readonly products=inject(ProductFacade);
  readonly order=computed(()=>this.auth.orderById(this.route.snapshot.paramMap.get('orderId')??''));
  readonly items=computed(()=>(this.order()?.items??[]).map(item=>({item,product:this.products.products().find(product=>product.sku===item.productSku)})));
  readonly timelineSteps=computed(()=>{
    const order=this.order();
    if(!order)return[];
    const entries=new Map(order.timeline.map(entry=>[entry.status,entry]));
    const currentIndex=this.regularFlow.indexOf(order.status);
    const steps=this.regularFlow.map((status,index)=>({
      status,
      occurredAt:entries.get(status)?.occurredAt,
      state:status===order.status?'current':entries.has(status)||currentIndex>index?'complete':'future',
    }));
    if(currentIndex<0)steps.push({status:order.status,occurredAt:entries.get(order.status)?.occurredAt,state:'current'});
    return steps;
  });
  constructor(){ const id=this.route.snapshot.paramMap.get('orderId'); if(id) void this.auth.loadOrder(id); }
  subtotal():number{return this.order()?.subtotal??0;}
  price(value:number):string{return formatPrice(value,this.order()?.currency??'AOA',this.products.currentLanguage(),true);}
}
