// Экспортируем только типы, сама логика перенесена в CartContext
export interface CartItem {
  id: number; // Технический идентификатор в рантайме (равен offerId)
  offerId: number; // product_entry.id
  status: 'active' | 'inactive';
  quantity: number;
}

export interface CartGroup {
  shopId: number;
  shopName: string;
  shopAddress: string;
  items: CartItem[];
  total: number;
}

// Реэкспортируем useCart из CartContext для обратной совместимости
export { useCart } from '@/contexts/CartContext';
