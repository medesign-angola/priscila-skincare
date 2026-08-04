export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered';

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
