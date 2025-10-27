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
    id: number;
    seller_id: number;
    images: ImageItem[];
}

export interface SellerMe {
    full_name: string;
    short_name: string;
    inn: string;
    is_IP: boolean;
    description: string;
    ogrn: string;
    status: number;
    verification_level: number;
    registration_doc_url: string;
    id: number;
    master_id: number;
    email: string;
    phone: string;
    balance: number;
    images: ImageItem[];
    shop_points?: ShopPoint[];
}

export const useSellerMe = () => {
  const [seller, setSeller] = useState<SellerMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SELLERS.BASE}/me`), {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setSeller(data.data || null);
        } else if (response.status === 404) {
          setError('Данные продавца не найдены');
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
  }, []);

  return {
    seller,
    loading,
    error,
  };
};
