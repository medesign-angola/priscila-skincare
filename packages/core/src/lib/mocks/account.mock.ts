import { Customer, Order } from '../models/account.interface';

export const MOCK_CUSTOMER: Customer = {
  id: 'customer-1',
  name: 'Miguel Paulo',
  phone: '+244 924 635 836',
  email: 'miguelpaulovida@gmail.com',
  addresses: [],
};

const deliveryAddress = {
  id: 'address-1',
  label: 'Casa',
  recipient: 'Miguel Paulo',
  phone: '+244 924 635 836',
  country: 'Angola',
  province: 'Luanda',
  neighborhood: 'Coqueiros',
  street: 'Rua dos Coqueiros, 45',
  houseNumber: '45',
  apartment: 'Apt. 3B',
  city: 'Luanda',
  isDefault: true,
};

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-0042',
    number: 'ORD-2026-0042',
    currency: 'AOA',
    placedAt: '2026-06-15T09:12:00',
    status: 'delivered',
    items: [
      { productId: 'prod-1', productSku: 'MOCK-1', productName: 'Produto', sizeLabel: '500ml', quantity: 2, unitPrice: 270000 },
      { productId: 'prod-3', productSku: 'MOCK-3', productName: 'Produto', sizeLabel: '250ml', quantity: 1, unitPrice: 185000 },
    ],
    timeline: [
      { status: 'confirmed', occurredAt: '2026-06-15T09:12:00' },
      { status: 'processing', occurredAt: '2026-06-15T14:30:00' },
      { status: 'shipped', occurredAt: '2026-06-16T08:00:00' },
      { status: 'delivered', occurredAt: '2026-06-18T11:45:00' },
    ],
    deliveryAddress,
    payment: { entity: '00011', reference: '999 123 456' },
    shippingPrice: 0,
    subtotal: 725000,
    total: 725000,
  },
  {
    id: 'ORD-2026-0031',
    number: 'ORD-2026-0031',
    currency: 'AOA',
    placedAt: '2026-05-02T10:00:00',
    status: 'delivered',
    items: [{ productId: 'prod-2', productSku: 'MOCK-2', productName: 'Produto', sizeLabel: '30ml', quantity: 1, unitPrice: 320000 }],
    timeline: [
      { status: 'confirmed', occurredAt: '2026-05-02T10:00:00' },
      { status: 'processing', occurredAt: '2026-05-02T15:00:00' },
      { status: 'shipped', occurredAt: '2026-05-03T08:00:00' },
      { status: 'delivered', occurredAt: '2026-05-05T12:00:00' },
    ],
    deliveryAddress,
    payment: { entity: '00011', reference: '888 654 321' },
    shippingPrice: 0,
    subtotal: 320000,
    total: 320000,
  },
];
