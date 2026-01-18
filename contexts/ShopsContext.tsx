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
  refetch: (sellerId?: number) => Promise<void>;
  getShopById: (id: number) => Shop | undefined;
  getShopsBySeller: (sellerId: number) => Shop[];
}

const ShopsContext = createContext<ShopsContextType | undefined>(undefined);

export const ShopsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentSellerId, setCurrentSellerId] = useState<number | undefined>(undefined);

  // Функция для загрузки всех точек продаж с сервера
  const fetchShops = useCallback(async (sellerId?: number) => {
    // Если sellerId не передан, не загружаем магазины
    if (sellerId === undefined) {
      setShops([]);
      setLoading(false);
      setIsInitialized(false);
      setCurrentSellerId(undefined);
      return;
    }

    // Если уже загружаем, не делаем повторный запрос
    if (loading) {
      return;
    }
    
    // Если уже загружено для этого продавца, не делаем повторный запрос
    if (isInitialized && currentSellerId === sellerId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Формируем URL с параметрами фильтрации по продавцу (для админки)
      const params = new URLSearchParams();
      params.append('seller_id', sellerId.toString());
      const url = `${getApiUrl(API_ENDPOINTS.SHOP_POINTS.BASE)}?${params.toString()}`;
      
      const response = await authFetch(url, {
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
          setCurrentSellerId(sellerId);
        } else {
          setError('Неверный формат данных точек продаж');
          setShops([]);
          setIsInitialized(true);
          setCurrentSellerId(sellerId);
        }
      } else if (response.status === 404) {
        setError('Точки продаж не найдены');
        setShops([]);
        setIsInitialized(true);
        setCurrentSellerId(sellerId);
      } else {
        const errorText = await response.text();
        setError('Ошибка загрузки точек продаж');
        setShops([]);
        setIsInitialized(true);
        setCurrentSellerId(sellerId);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setShops([]);
      setIsInitialized(true);
      setCurrentSellerId(sellerId);
    } finally {
      setLoading(false);
    }
  }, [loading, isInitialized, currentSellerId]);

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

export const useShops = (sellerId?: number) => {
  const context = useContext(ShopsContext);
  if (context === undefined) {
    throw new Error('useShops must be used within a ShopsProvider');
  }
  
  // Загружаем магазины при изменении sellerId
  React.useEffect(() => {
    // Если sellerId изменился или еще не загружено, делаем запрос
    if (sellerId !== undefined) {
      context.refetch(sellerId);
    } else {
      // Если sellerId не передан, очищаем список
      context.refetch(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);
  
  return context;
};


