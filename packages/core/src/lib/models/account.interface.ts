export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'paymentfailed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface CustomerAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  neighborhood: string;
  street: string;
  houseNumber?: string;
  apartment?: string;
  postalCode?: string;
  isDefault: boolean;
}

export type SaveCustomerAddress = Omit<CustomerAddress, 'id'>;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  addresses: CustomerAddress[];
}

export interface OrderItem {
  itemType?: 'product' | 'kit' | 'collection';
  reference?: string;
  productId?: string;
  productSku: string;
  productName: string;
  imageUrl?: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  occurredAt: string;
}

export interface Order {
  id: string;
  number: string;
  placedAt: string;
  status: OrderStatus;
  currency: 'AOA' | 'EUR';
  items: OrderItem[];
  timeline: OrderTimelineEntry[];
  deliveryAddress: CustomerAddress;
  payment?: { entity: string; reference: string };
  shippingPrice: number;
  subtotal: number;
  total: number;
}

export interface CheckoutPreview {
  addressId: string; currency: 'AOA' | 'EUR'; subtotal: number; shipping: number; total: number; items: ApiOrderItem[];
}
export interface ApiOrderItem { itemType?: 'product'|'kit'|'collection'; reference?: string; productSku?: string; productName: string; variant?: string; quantity: number; unitPrice: number; total: number; imageUrl?: string; }
