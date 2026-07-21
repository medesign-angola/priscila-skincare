import { computed, Injectable, signal } from '@angular/core';
import { MOCK_CUSTOMER, MOCK_ORDERS } from '../mocks/account.mock';
import { Customer, Order } from '../models/account.interface';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  readonly pendingEmail = signal('');
  readonly customer = signal<Customer | null>(null);
  readonly orders = signal<Order[]>(MOCK_ORDERS);
  readonly isAuthenticated = computed(() => this.customer() !== null);

  requestCode(email: string): void {
    this.pendingEmail.set(email);
  }

  verifyCode(code: string): boolean {
    if (!/^\d{6}$/.test(code)) return false;
    this.customer.set({ ...MOCK_CUSTOMER, email: this.pendingEmail() || MOCK_CUSTOMER.email });
    return true;
  }

  updateName(name: string): void {
    this.customer.update((customer) => customer ? { ...customer, name } : customer);
  }

  signOut(): void {
    this.customer.set(null);
    this.pendingEmail.set('');
  }

  orderById(id: string): Order | undefined {
    return this.orders().find((order) => order.id === id);
  }
}
