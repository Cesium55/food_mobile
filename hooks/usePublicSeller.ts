import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useEffect, useState } from 'react';

export interface PublicSeller {
    id: number;
    short_name: string;
    full_name: string; 
    is_IP: boolean;
    status: number;
    verification_level: number;
    images: ImageItem[];
}

export interface ImageItem {
    id: number;
    path: string;
    order: number;
}

export interface ShopPoint {
    latitude: number;
    longitude: number;
    address_raw: string;
    address_formated: string;
    region: string;
    city: string;
    street: string;
    house: string;
    geo_id: string;
    id: number;
    seller_id: number;
    images: ImageItem[];
}

export interface SellerWithShops {
    id: number;
    short_name: string;
    full_name: string;
    is_IP: boolean;
    status: number;
    verification_level: number;
    images: ImageItem[];
    shop_points: ShopPoint[];
}

// Глобальный кэш продавцов
const sellerCache = new Map<number, PublicSeller>();
const loadingPromises = new Map<number, Promise<PublicSeller | null>>();

/**
 * Заполняет кэш продавцов из списка (используется при загрузке списка продавцов)
 */
export function populateSellerCache(sellers: PublicSeller[]): void {
  sellers.forEach(seller => {
    sellerCache.set(seller.id, seller);
  });
}

/**
 * Получает продавца из кэша или загружает с сервера
 */
async function fetchSellerById(sellerId: number): Promise<PublicSeller | null> {
  // Проверяем кэш
  if (sellerCache.has(sellerId)) {
    return sellerCache.get(sellerId)!;
  }

  // Проверяем, не выполняется ли уже запрос для этого продавца
  if (loadingPromises.has(sellerId)) {
    return loadingPromises.get(sellerId)!;
  }

  // Создаем новый запрос
  const promise = (async () => {
    try {
      const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SELLERS.BASE}/${sellerId}`), {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        const seller = data.data || null;
        if (seller) {
          sellerCache.set(sellerId, seller);
        }
        return seller;
      } else if (response.status === 404) {
        return null;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    } finally {
      loadingPromises.delete(sellerId);
    }
  })();

  loadingPromises.set(sellerId, promise);
  return promise;
}

export const usePublicSeller = (sellerId: number | null) => {
  const [seller, setSeller] = useState<PublicSeller | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSeller = async () => {
      if (!sellerId) {
        setSeller(null);
        setLoading(false);
        setError(null);
        return;
      }

      // Проверяем кэш синхронно
      if (sellerCache.has(sellerId)) {
        setSeller(sellerCache.get(sellerId)!);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const fetchedSeller = await fetchSellerById(sellerId);
        
        if (fetchedSeller) {
          setSeller(fetchedSeller);
        } else {
          setError('Продавец не найден');
          setSeller(null);
        }
      } catch (err) {
        setError('Ошибка подключения к серверу');
        setSeller(null);
      } finally {
        setLoading(false);
      }
    };

    loadSeller();
  }, [sellerId]);

  return {
    seller,
    loading,
    error,
  };
};

export const useSellerWithShops = (sellerId: number | null) => {
  const [seller, setSeller] = useState<SellerWithShops | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeller = async () => {
      if (!sellerId) {
        setSeller(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SELLERS.BASE}/${sellerId}/with-shops`), {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setSeller(data.data || null);
        } else if (response.status === 404) {
          setError('Продавец не найден');
          setSeller(null);
        } else {
          setError('Ошибка загрузки данных продавца');
          setSeller(null);
        }
      } catch (err) {
        setError('Ошибка подключения к серверу');
        setSeller(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  return {
    seller,
    loading,
    error,
  };
};