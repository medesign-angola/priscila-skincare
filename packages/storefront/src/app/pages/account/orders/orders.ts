import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '@org/core';
import { OrderCard } from '../components/order-card/order-card';
@Component({selector:'app-orders',imports:[RouterLink,TranslatePipe,OrderCard],templateUrl:'./orders.html',styleUrl:'./orders.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class Orders { readonly auth=inject(AuthFacade); }
