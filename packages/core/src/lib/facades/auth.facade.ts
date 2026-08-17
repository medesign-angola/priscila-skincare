import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { API_CONFIG } from '../config/api.config';
import { CheckoutPreview, Customer, CustomerAddress, Order, SaveCustomerAddress } from '../models/account.interface';
import { AuthenticationResponse, AuthSessionStore, SessionRefreshService } from '../services/auth-session.service';

interface OtpRequestResponse {
  expiresAt: string;
  resendAfterSeconds: number;
}

interface ApiCustomer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  acceptsMarketing: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly session = inject(AuthSessionStore);
  private readonly refresher = inject(SessionRefreshService);
  private readonly translate = inject(TranslateService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private restoration?: Promise<boolean>;

  readonly pendingEmail = signal(this.readPendingEmail());
  readonly pendingMarketing = signal(this.readPendingMarketing());
  readonly customer = signal<Customer | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly errorCode = signal<string | null>(null);
  readonly resendSeconds = signal(0);
  readonly isAuthenticated = computed(() => this.session.hasUsableAccessToken());

  async requestCode(email: string, acceptsMarketing = this.pendingMarketing()): Promise<OtpRequestResponse> {
    this.loading.set(true);
    this.errorCode.set(null);
    try {
      const response = await firstValueFrom(this.http.post<OtpRequestResponse>(
        `${this.config.baseUrl}/auth/otp/request`,
        { email, locale: this.translate.currentLang() === 'fr' ? 'fr' : 'pt' },
        { withCredentials: true },
      ));
      this.pendingEmail.set(email);
      this.pendingMarketing.set(acceptsMarketing);
      this.resendSeconds.set(response.resendAfterSeconds);
      if (this.isBrowser) {
        sessionStorage.setItem('psc_pending_email', email);
        sessionStorage.setItem('psc_pending_marketing', String(acceptsMarketing));
      }
      return response;
    } catch (error) {
      this.errorCode.set(this.problemCode(error));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async verifyCode(code: string): Promise<boolean> {
    const email = this.pendingEmail();
    if (!email || !/^\d{6}$/.test(code)) return false;

    this.loading.set(true);
    this.errorCode.set(null);
    try {
      const response = await firstValueFrom(this.http.post<AuthenticationResponse>(
        `${this.config.baseUrl}/auth/otp/verify`,
        { email, code, acceptsMarketing: this.pendingMarketing() },
        { withCredentials: true },
      ));
      this.session.save(response);
      await this.loadCustomer();
      if (this.isBrowser) {
        sessionStorage.removeItem('psc_pending_email');
        sessionStorage.removeItem('psc_pending_marketing');
      }
      return true;
    } catch (error) {
      this.errorCode.set(this.problemCode(error));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  ensureSession(): Promise<boolean> {
    if (!this.isBrowser) return Promise.resolve(false);
    if (this.session.hasUsableAccessToken()) {
      return this.customer() ? Promise.resolve(true) : this.loadCustomer().then(() => true).catch(() => false);
    }
    if (!this.restoration) {
      this.restoration = firstValueFrom(this.refresher.refresh())
        .then(() => this.loadCustomer())
        .then(() => true)
        .catch(() => false)
        .finally(() => { this.restoration = undefined; });
    }
    return this.restoration;
  }

  async updateProfile(name: string, phone?: string): Promise<void> {
    const customer = await firstValueFrom(this.http.put<ApiCustomer>(
      `${this.config.baseUrl}/customers/me`,
      { name, phone: phone || null },
    ));
    this.customer.set(this.mapCustomer(customer, this.customer()?.addresses ?? []));
  }

  async createAddress(address: SaveCustomerAddress): Promise<CustomerAddress> {
    const created = await firstValueFrom(this.http.post<CustomerAddress>(
      `${this.config.baseUrl}/customers/me/addresses`, address,
    ));
    this.replaceAddresses([...(this.customer()?.addresses ?? []), created]);
    return created;
  }

  async updateAddress(id: string, address: SaveCustomerAddress): Promise<CustomerAddress> {
    const updated = await firstValueFrom(this.http.put<CustomerAddress>(
      `${this.config.baseUrl}/customers/me/addresses/${id}`, address,
    ));
    this.replaceAddresses((this.customer()?.addresses ?? []).map((item) => item.id === id ? updated : item));
    return updated;
  }

  async makeDefaultAddress(id: string): Promise<void> {
    await firstValueFrom(this.http.put<void>(
      `${this.config.baseUrl}/customers/me/addresses/${id}/default`, {},
    ));
    this.replaceAddresses((this.customer()?.addresses ?? []).map((item) => ({ ...item, isDefault: item.id === id })));
  }

  async deleteAddress(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.config.baseUrl}/customers/me/addresses/${id}`));
    await this.loadAddresses();
  }

  async updateName(name: string): Promise<void> {
    await this.updateProfile(name, this.customer()?.phone);
  }

  async loadOrders(): Promise<void> {
    const orders = await firstValueFrom(this.http.get<ApiOrder[]>(`${this.config.baseUrl}/orders`));
    this.orders.set(orders.map(mapOrder));
  }

  async loadOrder(id: string): Promise<Order | undefined> {
    try {
      const order = mapOrder(await firstValueFrom(this.http.get<ApiOrder>(`${this.config.baseUrl}/orders/${id}`)));
      this.orders.update(items => [order, ...items.filter(item => item.id !== order.id)]);
      return order;
    } catch { return undefined; }
  }

  async checkoutPreview(addressId: string, currency: 'AOA'|'EUR', locale: string): Promise<CheckoutPreview> {
    return firstValueFrom(this.http.post<CheckoutPreview>(`${this.config.baseUrl}/orders/preview`, { addressId, currency, locale }));
  }

  async createOrder(addressId: string, currency: 'AOA'|'EUR', locale: string, idempotencyKey: string): Promise<Order> {
    const order = mapOrder(await firstValueFrom(this.http.post<ApiOrder>(`${this.config.baseUrl}/orders`, { addressId, currency, locale, idempotencyKey })));
    this.orders.update(items => [order, ...items]);
    return order;
  }

  async signOut(): Promise<void> {
    try {
      await firstValueFrom(this.http.post<void>(
        `${this.config.baseUrl}/auth/logout`,
        {},
        { withCredentials: true },
      ));
    } finally {
      this.session.clear();
      this.customer.set(null);
      this.pendingEmail.set('');
      if (this.isBrowser) {
        sessionStorage.removeItem('psc_pending_email');
        sessionStorage.removeItem('psc_pending_marketing');
      }
    }
  }

  orderById(id: string): Order | undefined {
    return this.orders().find((order) => order.id === id);
  }

  private async loadCustomer(): Promise<void> {
    const [customer, addresses] = await Promise.all([
      firstValueFrom(this.http.get<ApiCustomer>(`${this.config.baseUrl}/customers/me`)),
      firstValueFrom(this.http.get<CustomerAddress[]>(`${this.config.baseUrl}/customers/me/addresses`)),
    ]);
    this.customer.set(this.mapCustomer(customer, addresses));
    await this.loadOrders();
  }

  private async loadAddresses(): Promise<void> {
    const addresses = await firstValueFrom(
      this.http.get<CustomerAddress[]>(`${this.config.baseUrl}/customers/me/addresses`),
    );
    this.replaceAddresses(addresses);
  }

  private replaceAddresses(addresses: CustomerAddress[]): void {
    const customer = this.customer();
    if (customer) this.customer.set({ ...customer, addresses });
  }

  private mapCustomer(customer: ApiCustomer, addresses: CustomerAddress[]): Customer {
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name ?? '',
      phone: customer.phone ?? '',
      addresses,
    };
  }

  private readPendingEmail(): string {
    return this.isBrowser ? sessionStorage.getItem('psc_pending_email') ?? '' : '';
  }

  private readPendingMarketing(): boolean {
    return this.isBrowser && sessionStorage.getItem('psc_pending_marketing') === 'true';
  }

  private problemCode(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.code === 'string') return error.error.code;
    return 'request_failed';
  }
}

interface ApiOrder {
  id: string; number: string; placedAt: string; status: Order['status']; currency: 'AOA'|'EUR'; subtotal: number; shipping: number; total: number;
  items: { itemType?:'product'|'kit'|'collection'; reference?:string; productSku?: string; productName: string; variant?: string; quantity: number; unitPrice: number; imageUrl?: string }[];
  deliveryAddress: CustomerAddress; timeline: { status: Order['status']; occurredAt: string }[];
}
const mapOrder = (order: ApiOrder): Order => ({ id: order.id, number: order.number, placedAt: order.placedAt, status: order.status,
  currency: order.currency, subtotal: order.subtotal, shippingPrice: order.shipping, total: order.total,
  items: order.items.map(item => ({ itemType:item.itemType,reference:item.reference,productSku:item.reference??item.productSku??'', productName: item.productName, imageUrl: item.imageUrl,
    sizeLabel: item.variant ?? '', quantity: item.quantity, unitPrice: item.unitPrice })),
  deliveryAddress: order.deliveryAddress, timeline: order.timeline });
