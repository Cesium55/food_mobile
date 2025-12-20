import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useCallback, useEffect, useState } from 'react';

export interface Category {
  id: number;
  name: string;
  parent_category_id: number | null;
}

export interface CategoryWithOffers extends Category {
  offers?: any[]; // Офферы для категории
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = getApiUrl(API_ENDPOINTS.CATEGORIES.BASE);
      console.log('🚀 API FETCH Categories:', url);

      const response = await authFetch(url, {
        method: 'GET',
        requireAuth: false,
      });

      if (response.ok) {
        const data = await response.json();
        const categoriesData = data.data || data;
        
        console.log('📦 API RESPONSE Categories (RAW):', JSON.stringify(categoriesData, null, 2));
        
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          setError('Неверный формат данных категорий');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API ERROR Categories:', response.status, errorText);
        setError('Ошибка загрузки категорий');
      }
    } catch (err) {
      console.error('❌ API CRASH Categories:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  }, []);

  // Получить офферы для конкретной категории
  const fetchCategoryOffers = useCallback(async (categoryId: number) => {
    try {
      const url = getApiUrl(`${API_ENDPOINTS.CATEGORIES.BASE}/${categoryId}/offers`);
      console.log('🚀 API FETCH Category Offers:', url);

      const response = await authFetch(url, {
        method: 'GET',
        requireAuth: false,
      });

      if (response.ok) {
        const data = await response.json();
        const offersData = data.data || data;
        
        console.log(`📦 API RESPONSE Offers for category ${categoryId}:`, Array.isArray(offersData) ? offersData.length : 'not array');
        
        return Array.isArray(offersData) ? offersData : [];
      } else {
        console.error('❌ API ERROR Category Offers:', response.status);
        return [];
      }
    } catch (err) {
      console.error('❌ API CRASH Category Offers:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getTopLevelCategories = () => 
    categories.filter(c => !c.parent_category_id || c.parent_category_id === 0);

  const getSubCategories = (parentId: number) => 
    categories.filter(c => Number(c.parent_category_id) === Number(parentId));

  const getCategoryById = (categoryId: number): Category | undefined => {
    return categories.find(c => Number(c.id) === Number(categoryId));
  };

  const getCategoryPath = (categoryId: number): Category[] => {
    const path: Category[] = [];
    let currentId: number | null = categoryId;
    
    while (currentId !== null) {
      const category = getCategoryById(currentId);
      if (category) {
        path.unshift(category);
        currentId = category.parent_category_id;
      } else {
        break;
      }
    }
    
    return path;
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    getTopLevelCategories,
    getSubCategories,
    getCategoryById,
    getCategoryPath,
    fetchCategoryOffers,
  };
};
