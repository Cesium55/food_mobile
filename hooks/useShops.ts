import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useCallback, useEffect, useState } from 'react';

export interface Shop {
  id: number;
  sellerId: number;
  name: string; // Для совместимости с кодом
  shortName: string;
  fullName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  workingHours?: string;
}

export const useShops = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Функция для загрузки всех точек продаж с сервера
  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем все точки продаж (для текущего продавца в админке)
      const response = await authFetch(getApiUrl(API_ENDPOINTS.SHOP_POINTS.BASE), {
        method: 'GET',
        requireAuth: true,
      });

      if (response.ok) {
        const data = await response.json();
        // Ожидаем структуру ответа: { data: ShopPoint[] } или просто ShopPoint[]
        const shopPointsData = data.data || data;
        
        if (Array.isArray(shopPointsData)) {
          // Преобразуем ShopPoint в Shop формат для совместимости
          const transformedShops: Shop[] = shopPointsData.map((point: any) => ({
            id: point.id,
            sellerId: point.seller_id,
            name: point.address_formated || point.address_raw || 'Торговая точка', // Для совместимости
            shortName: point.address_formated?.split(',')[0] || point.address_raw?.split(',')[0] || 'Точка',
            fullName: point.address_formated || point.address_raw || `Торговая точка #${point.id}`,
            address: point.address_formated || point.address_raw || '',
            latitude: point.latitude,
            longitude: point.longitude,
            phone: undefined, // Пока нет в API
            workingHours: undefined, // Пока нет в API
          }));
          
          setShops(transformedShops);
        } else {
          console.error('❌ Неверный формат данных точек продаж:', shopPointsData);
          setError('Неверный формат данных точек продаж');
          setShops([]);
        }
      } else if (response.status === 404) {
        setError('Точки продаж не найдены');
        setShops([]);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка загрузки точек продаж:', response.status, errorText);
        setError('Ошибка загрузки точек продаж');
        setShops([]);
      }
    } catch (err) {
      console.error('❌ Ошибка подключения к серверу при загрузке точек продаж:', err);
      setError('Ошибка подключения к серверу');
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const getShopById = (id: number): Shop | undefined => {
    return shops.find((shop) => shop.id === id);
  };

  const getShopsBySeller = (sellerId: number): Shop[] => {
    return shops.filter((shop) => shop.sellerId === sellerId);
  };

  // Функция для повторной загрузки точек продаж
  const refetch = useCallback(async () => {
    await fetchShops();
  }, [fetchShops]);

  return {
    shops,
    loading,
    error,
    refetch,
    getShopById,
    getShopsBySeller,
  };
};

