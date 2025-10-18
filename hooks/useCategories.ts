import { useState } from 'react';

export interface Category {
  id: number;
  name: string;
  parent_category_id: number | null;
}

export const useCategories = () => {
  const [categories] = useState<Category[]>([
    // Категории верхнего уровня
    { id: 1, name: 'Молочные продукты', parent_category_id: null },
    { id: 2, name: 'Мясо и птица', parent_category_id: null },
    { id: 3, name: 'Овощи и фрукты', parent_category_id: null },
    { id: 4, name: 'Хлеб и выпечка', parent_category_id: null },
    { id: 5, name: 'Напитки', parent_category_id: null },
    { id: 6, name: 'Бакалея', parent_category_id: null },
    { id: 7, name: 'Замороженные продукты', parent_category_id: null },
    { id: 8, name: 'Кондитерские изделия', parent_category_id: null },

    // Подкатегории: Молочные продукты (1)
    { id: 11, name: 'Молоко', parent_category_id: 1 },
    { id: 12, name: 'Кефир и йогурты', parent_category_id: 1 },
    { id: 13, name: 'Творог и сырки', parent_category_id: 1 },
    { id: 14, name: 'Сыры', parent_category_id: 1 },
    { id: 15, name: 'Сметана', parent_category_id: 1 },
    { id: 16, name: 'Масло сливочное', parent_category_id: 1 },

    // Подкатегории: Мясо и птица (2)
    { id: 21, name: 'Свинина', parent_category_id: 2 },
    { id: 22, name: 'Говядина', parent_category_id: 2 },
    { id: 23, name: 'Курица', parent_category_id: 2 },
    { id: 24, name: 'Фарш', parent_category_id: 2 },
    { id: 25, name: 'Колбасы и сосиски', parent_category_id: 2 },
    { id: 26, name: 'Деликатесы', parent_category_id: 2 },

    // Подкатегории: Овощи и фрукты (3)
    { id: 31, name: 'Овощи свежие', parent_category_id: 3 },
    { id: 32, name: 'Фрукты свежие', parent_category_id: 3 },
    { id: 33, name: 'Зелень', parent_category_id: 3 },
    { id: 34, name: 'Ягоды', parent_category_id: 3 },
    { id: 35, name: 'Грибы', parent_category_id: 3 },

    // Подкатегории: Хлеб и выпечка (4)
    { id: 41, name: 'Хлеб белый', parent_category_id: 4 },
    { id: 42, name: 'Хлеб черный', parent_category_id: 4 },
    { id: 43, name: 'Батоны', parent_category_id: 4 },
    { id: 44, name: 'Булочки', parent_category_id: 4 },
    { id: 45, name: 'Пирожки', parent_category_id: 4 },
    { id: 46, name: 'Круассаны', parent_category_id: 4 },

    // Подкатегории: Напитки (5)
    { id: 51, name: 'Вода', parent_category_id: 5 },
    { id: 52, name: 'Соки', parent_category_id: 5 },
    { id: 53, name: 'Газированные напитки', parent_category_id: 5 },
    { id: 54, name: 'Чай', parent_category_id: 5 },
    { id: 55, name: 'Кофе', parent_category_id: 5 },

    // Подкатегории: Бакалея (6)
    { id: 61, name: 'Крупы', parent_category_id: 6 },
    { id: 62, name: 'Макароны', parent_category_id: 6 },
    { id: 63, name: 'Мука', parent_category_id: 6 },
    { id: 64, name: 'Сахар', parent_category_id: 6 },
    { id: 65, name: 'Масло растительное', parent_category_id: 6 },
    { id: 66, name: 'Консервы', parent_category_id: 6 },

    // Подкатегории: Замороженные продукты (7)
    { id: 71, name: 'Овощи замороженные', parent_category_id: 7 },
    { id: 72, name: 'Ягоды замороженные', parent_category_id: 7 },
    { id: 73, name: 'Мясо замороженное', parent_category_id: 7 },
    { id: 74, name: 'Полуфабрикаты', parent_category_id: 7 },
    { id: 75, name: 'Мороженое', parent_category_id: 7 },

    // Подкатегории: Кондитерские изделия (8)
    { id: 81, name: 'Конфеты', parent_category_id: 8 },
    { id: 82, name: 'Шоколад', parent_category_id: 8 },
    { id: 83, name: 'Печенье', parent_category_id: 8 },
    { id: 84, name: 'Торты', parent_category_id: 8 },
    { id: 85, name: 'Пирожные', parent_category_id: 8 },
  ]);

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

  return {
    categories,
    getCategoryById,
    getTopLevelCategories,
    getSubCategories,
    hasSubCategories,
    getCategoryPath,
    getCategoryBranch,
  };
};

