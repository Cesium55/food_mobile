import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Функция для загрузки всех точек продаж с сервера
  const fetchShops = useCallback(async () => {
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

  // Загружаем магазины при инициализации
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

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
  return context;
};


