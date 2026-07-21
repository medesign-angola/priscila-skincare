export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered';

export interface CustomerAddress {
  id: string;
  recipient: string;
  street: string;
  apartment?: string;
  city: string;
  country: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  addresses: CustomerAddress[];
}

export interface OrderItem {
  productId: string;
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
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  timeline: OrderTimelineEntry[];
  deliveryAddress: CustomerAddress;
  payment: { entity: string; reference: string };
  shippingPrice: number;
}
