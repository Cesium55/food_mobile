// Экспортируем только типы, сама логика перенесена в CartContext
export interface CartItem {
  id: number;
  offerId: number; // product_entry.id
  productName: string;
  shopId: number;
  shopName: string;
  originalCost: string; // Цена без скидки (decimal формат)
  currentCost: string | null; // Цена со скидкой (может быть null для динамического ценообразования, decimal формат)
  discount: number; // Процент скидки
  quantity: number;
  expiresDate: Date;
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

