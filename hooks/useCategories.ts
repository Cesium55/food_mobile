import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useCallback, useEffect, useState } from 'react';

export interface Category {
  id: number;
  name: string;
  parent_category_id: number | null;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Функция для загрузки категорий с сервера
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Используем endpoint для получения всех категорий (плоский список)
      const response = await authFetch(getApiUrl(API_ENDPOINTS.CATEGORIES.BASE), {
        method: 'GET',
        requireAuth: false, // Категории - публичные данные
      });

      if (response.ok) {
        const data = await response.json();
        // Ожидаем структуру ответа: { data: Category[] } или просто Category[]
        const categoriesData = data.data || data;
        
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error('❌ Неверный формат данных категорий:', categoriesData);
          setError('Неверный формат данных категорий');
          setCategories([]);
        }
      } else if (response.status === 404) {
        setError('Категории не найдены');
        setCategories([]);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка загрузки категорий:', response.status, errorText);
        setError('Ошибка загрузки категорий');
        setCategories([]);
      }
    } catch (err) {
      console.error('❌ Ошибка подключения к серверу при загрузке категорий:', err);
      setError('Ошибка подключения к серверу');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []); // Зависимости пустые, так как функция не зависит от внешних переменных

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Получить категорию по ID
  const getCategoryById = (id: number): Category | undefined => {
    return categories.find((category) => category.id === id);
  };

  // Получить категории верхнего уровня (без родителя)
  const getTopLevelCategories = (): Category[] => {
    return categories.filter((category) => category.parent_category_id === null);
  };

  // Получить подкатегории для категории
  const getSubCategories = (parentId: number): Category[] => {
    return categories.filter((category) => category.parent_category_id === parentId);
  };

  // Проверить, есть ли у категории подкатегории
  const hasSubCategories = (categoryId: number): boolean => {
    return categories.some((category) => category.parent_category_id === categoryId);
  };

  // Получить путь от корня до категории (для breadcrumbs)
  const getCategoryPath = (categoryId: number): Category[] => {
    const path: Category[] = [];
    let currentCategory = getCategoryById(categoryId);

    while (currentCategory) {
      path.unshift(currentCategory);
      currentCategory = currentCategory.parent_category_id
        ? getCategoryById(currentCategory.parent_category_id)
        : undefined;
    }

    return path;
  };

  // Получить все категории для конкретной ветки (родитель + все дочерние)
  const getCategoryBranch = (categoryId: number): Category[] => {
    const branch: Category[] = [];
    const category = getCategoryById(categoryId);
    
    if (category) {
      branch.push(category);
      const subCategories = getSubCategories(categoryId);
      branch.push(...subCategories);
    }

    return branch;
  };

  // Функция для повторной загрузки категорий
  const refetch = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch,
    getCategoryById,
    getTopLevelCategories,
    getSubCategories,
    hasSubCategories,
    getCategoryPath,
    getCategoryBranch,
  };
};

