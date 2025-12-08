import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import React, { createContext, useCallback, useContext, useState } from 'react';

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

interface ShopsContextType {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getShopById: (id: number) => Shop | undefined;
  getShopsBySeller: (sellerId: number) => Shop[];
}

const ShopsContext = createContext<ShopsContextType | undefined>(undefined);

export const ShopsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Функция для загрузки всех точек продаж с сервера
  const fetchShops = useCallback(async () => {
    // Если уже загружаем или уже загружено, не делаем повторный запрос
    if (loading || isInitialized) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(getApiUrl(API_ENDPOINTS.SHOP_POINTS.BASE), {
        method: 'GET',
        requireAuth: true,
      });

      if (response.ok) {
        const data = await response.json();
        const shopPointsData = data.data || data;
        
        if (Array.isArray(shopPointsData)) {
          const transformedShops: Shop[] = shopPointsData.map((point: any) => ({
            id: point.id,
            sellerId: point.seller_id,
            name: point.address_formated || point.address_raw || 'Торговая точка',
            shortName: point.address_formated?.split(',')[0] || point.address_raw?.split(',')[0] || 'Точка',
            fullName: point.address_formated || point.address_raw || `Торговая точка #${point.id}`,
            address: point.address_formated || point.address_raw || '',
            latitude: point.latitude,
            longitude: point.longitude,
            phone: undefined,
            workingHours: undefined,
          }));
          
          setShops(transformedShops);
          setIsInitialized(true);
        } else {
          console.error('❌ Неверный формат данных точек продаж:', shopPointsData);
          setError('Неверный формат данных точек продаж');
          setShops([]);
          setIsInitialized(true);
        }
      } else if (response.status === 404) {
        setError('Точки продаж не найдены');
        setShops([]);
        setIsInitialized(true);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка загрузки точек продаж:', response.status, errorText);
        setError('Ошибка загрузки точек продаж');
        setShops([]);
        setIsInitialized(true);
      }
    } catch (err) {
      console.error('❌ Ошибка подключения к серверу при загрузке точек продаж:', err);
      setError('Ошибка подключения к серверу');
      setShops([]);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [loading, isInitialized]);

  const getShopById = useCallback((id: number): Shop | undefined => {
    return shops.find((shop) => shop.id === id);
  }, [shops]);

  const getShopsBySeller = useCallback((sellerId: number): Shop[] => {
    return shops.filter((shop) => shop.sellerId === sellerId);
  }, [shops]);

  const value: ShopsContextType = {
    shops,
    loading,
    error,
    refetch: fetchShops,
    getShopById,
    getShopsBySeller,
  };

  return <ShopsContext.Provider value={value}>{children}</ShopsContext.Provider>;
};

export const useShops = () => {
  const context = useContext(ShopsContext);
  if (context === undefined) {
    throw new Error('useShops must be used within a ShopsProvider');
  }
  
  // Ленивая загрузка - загружаем только когда хук используется
  React.useEffect(() => {
    if (!context.loading && context.shops.length === 0 && !context.error) {
      context.refetch();
    }
  }, []);
  
  return context;
};


