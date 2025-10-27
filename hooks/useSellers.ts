import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useEffect, useState } from 'react';

export interface Seller {
  id: number;
  full_name: string;
  short_name: string;
  inn: string;
  type: number;
  ogrn: string;
  master_id: number;
  status: number;
  verification_level: number;
  registration_doc_url: string;
  balance: number;
}

export const useSellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const response = await authFetch(getApiUrl(API_ENDPOINTS.SELLERS.BASE), {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setSellers(data.data || []);
        } else {
          setError('Ошибка загрузки продавцов');
        }
      } catch (err) {
        setError('Ошибка загрузки продавцов');
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  const getSellerById = (id: number): Seller | undefined => {
    return sellers.find(seller => seller.id === id);
  };

  const getSellersByStatus = (status: number): Seller[] => {
    return sellers.filter(seller => seller.status === status);
  };

  const getSellersByVerificationLevel = (level: number): Seller[] => {
    return sellers.filter(seller => seller.verification_level === level);
  };

  return {
    sellers,
    loading,
    error,
    getSellerById,
    getSellersByStatus,
    getSellersByVerificationLevel,
  };
};
