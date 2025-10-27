import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { PublicSeller } from '@/hooks/usePublicSeller';
import { authFetch } from '@/utils/authFetch';
import { useEffect, useState } from 'react';


export const useSellers = () => {
  const [sellers, setSellers] = useState<PublicSeller[]>([]);
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

  const getSellerById = (id: number): PublicSeller | undefined => {
    return sellers.find(seller => seller.id === id);
  };

  const getSellersByStatus = (status: number): PublicSeller[] => {
    return sellers.filter(seller => seller.status === status);
  };

  const getSellersByVerificationLevel = (level: number): PublicSeller[] => {
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
