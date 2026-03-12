import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useCallback, useEffect, useState } from 'react';

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

interface UpdateSellerPayload {
  full_name?: string;
  short_name?: string;
  description?: string;
}

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const json = await response.json();
    if (typeof json?.detail === 'string') return json.detail;
    if (typeof json?.message === 'string') return json.message;
    if (typeof json?.data?.detail === 'string') return json.data.detail;
    if (typeof json?.data?.message === 'string') return json.data.message;
  } catch {
    // no-op
  }

  try {
    const text = await response.text();
    if (text) return text;
  } catch {
    // no-op
  }

  return fallbackMessage;
}

export const useSellerMe = () => {
  const [seller, setSeller] = useState<SellerMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeller = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SELLERS.BASE}/me`), {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setSeller(data.data || null);
        return data.data || null;
      }

      if (response.status === 404) {
        setError('Данные продавца не найдены');
        setSeller(null);
        return null;
      }

      const errorMessage = await extractErrorMessage(response, 'Ошибка загрузки данных продавца');
      setError(errorMessage);
      setSeller(null);
      return null;
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setSeller(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeller();
  }, [fetchSeller]);

  const updateSeller = useCallback(async (sellerId: number, payload: UpdateSellerPayload): Promise<SellerMe> => {
    const response = await authFetch(getApiUrl(`${API_ENDPOINTS.SELLERS.BASE}/${sellerId}`), {
      method: 'PUT',
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response, 'Не удалось обновить данные продавца');
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const updatedSeller = (data.data || data) as SellerMe;
    setSeller(updatedSeller);
    setError(null);
    return updatedSeller;
  }, []);

  return {
    seller,
    loading,
    error,
    refetch: fetchSeller,
    updateSeller,
  };
};
