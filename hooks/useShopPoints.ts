import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useEffect, useState } from 'react';

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

export const useShopPoints = (sellerId?: number) => {
  const [shopPoints, setShopPoints] = useState<ShopPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopPoints = async () => {
      if (!sellerId) {
        setShopPoints([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SHOP_POINTS.BASE}/seller/${sellerId}`), {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setShopPoints(data.data || []);
        } else if (response.status === 404) {
          setError('Торговые точки не найдены');
          setShopPoints([]);
        } else {
          setError('Ошибка загрузки торговых точек');
          setShopPoints([]);
        }
      } catch (err) {
        setError('Ошибка подключения к серверу');
        setShopPoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShopPoints();
  }, [sellerId]);

  return {
    shopPoints,
    loading,
    error,
  };
};

// Глобальный кэш для shop points (вне хука, чтобы сохранялся между монтированиями)
const shopPointCache = new Map<number, ShopPoint>();
// Отслеживаем, для каких shop points уже был сделан запрос (чтобы не делать повторные запросы)
const shopPointRequestsMade = new Set<number>();

export const useShopPoint = (pointId: number | null) => {
  const [shopPoint, setShopPoint] = useState<ShopPoint | null>(pointId ? shopPointCache.get(pointId) || null : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopPoint = async () => {
      if (!pointId) {
        setShopPoint(null);
        setLoading(false);
        return;
      }

      // Проверяем кэш перед запросом
      const cached = shopPointCache.get(pointId);
      if (cached) {
        setShopPoint(cached);
        setLoading(false);
        return;
      }

      // Если запрос уже был сделан для этого shop point, не делаем его снова
      if (shopPointRequestsMade.has(pointId)) {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        shopPointRequestsMade.add(pointId); // Отмечаем, что запрос был сделан
        
        const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SHOP_POINTS.BASE}/${pointId}`), {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          const shopPointData = data.data || null;
          if (shopPointData) {
            // Кэшируем данные
            shopPointCache.set(pointId, shopPointData);
            setShopPoint(shopPointData);
          } else {
            setShopPoint(null);
          }
        } else if (response.status === 404) {
          setError('Торговая точка не найдена');
          setShopPoint(null);
        } else {
          setError('Ошибка загрузки торговой точки');
          setShopPoint(null);
        }
      } catch (err) {
        setError('Ошибка подключения к серверу');
        setShopPoint(null);
      } finally {
        setLoading(false);
      }
    };

    fetchShopPoint();
  }, [pointId]);

  return {
    shopPoint,
    loading,
    error,
  };
};
