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

export const usePublicSeller = (sellerId: number | null) => {
  const [seller, setSeller] = useState<PublicSeller | null>(null);
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
        
        const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SELLERS.BASE}/${sellerId}`), {
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