export interface CartItem {
  id?: string;
  productId: string;
  productSku: string;
  sizeId: string;
  sizeLabel?: string;
  quantity: number;
  available?: boolean;
  stock?: number | null;
}

export interface ApiCartItem {
  id: string;
  itemType: 'product' | 'kit' | 'collection';
  reference: string;
  productSku: string;
  productName: string;
  variantId?: string | null;
  variantLabel?: string | null;
  quantity: number;
  aoaPrice: number;
  eurPrice: number;
  isAvailable: boolean;
  stock?: number | null;
  imageUrl?: string | null;
}

export interface ApiCart { id?: string | null; items: ApiCartItem[]; aoaSubtotal: number; eurSubtotal: number; }
