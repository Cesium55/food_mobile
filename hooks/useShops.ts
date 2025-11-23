// Экспортируем только типы, сама логика перенесена в ShopsContext
export interface Shop {
  id: number;
  sellerId: number;
  name: string;
  shortName: string;
  fullName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  workingHours?: string;
}

// Реэкспортируем хук из контекста
export { useShops } from '@/contexts/ShopsContext';

