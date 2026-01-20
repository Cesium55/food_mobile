import { TabScreen } from '@/components/TabScreen';
import { MiniOfferCard } from '@/components/offers/mini/MiniOfferCard';
import { createProductModal } from '@/components/product/ProductModalContent';
import { useModal } from '@/contexts/ModalContext';
import { Category, useCategories } from '@/hooks/useCategories';
import { Offer, useOffers } from '@/hooks/useOffers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Компонент для отрисовки одной категории верхнего уровня с фильтрацией по подкатегориям
const CategorySection = ({ 
  category, 
  getSubCategories,
  fetchOffersByCategory
}: { 
  category: Category;
  getSubCategories: (parentId: number) => Category[];
  fetchOffersByCategory: (categoryId: number) => Promise<Offer[]>;
}) => {
  // Путь выбранных подкатегорий (от корня к текущей)
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { openModal } = useModal();
  const scrollViewRef = useRef<ScrollView>(null);
  const offersScrollViewRef = useRef<ScrollView>(null);

  // Текущая активная категория для загрузки товаров (последняя в пути или корневая)
  const activeCategoryId = useMemo(() => {
    return selectedCategoryPath.length > 0 
      ? selectedCategoryPath[selectedCategoryPath.length - 1].id 
      : category.id;
  }, [selectedCategoryPath, category.id]);

  // Подкатегории для отображения: весь путь выбранных (n-1, n-2...) + подкатегории следующего уровня
  const displaySubcategories = useMemo(() => {
    if (selectedCategoryPath.length === 0) {
      // Если ничего не выбрано - показываем подкатегории первого уровня
      return getSubCategories(category.id);
    } else {
      // Если выбрана подкатегория - показываем весь путь (все выбранные) + подкатегории следующего уровня
      const lastSelected = selectedCategoryPath[selectedCategoryPath.length - 1];
      const nextLevel = getSubCategories(lastSelected.id);
      // Возвращаем весь путь выбранных + дочерние последней выбранной
      return [...selectedCategoryPath, ...nextLevel];
    }
  }, [selectedCategoryPath, category.id, getSubCategories]);

  // ID выбранной подкатегории (последняя в пути)
  const selectedSubcategoryId = useMemo(() => {
    return selectedCategoryPath.length > 0
      ? selectedCategoryPath[selectedCategoryPath.length - 1].id
      : null;
  }, [selectedCategoryPath]);

  // Загружаем товары при изменении активной категории
  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true);
      const data = await fetchOffersByCategory(activeCategoryId);
      setOffers(data);
      setLoading(false);
    };
    loadOffers();
  }, [activeCategoryId, fetchOffersByCategory]);

  const handleProductPress = (offer: Offer) => {
    const { content, footer } = createProductModal(offer);
    openModal(content, footer);
  };

  const handleSubcategoryPress = (subcategory: Category) => {
    // Проверяем, находится ли эта подкатегория в пути
    const indexInPath = selectedCategoryPath.findIndex(cat => Number(cat.id) === Number(subcategory.id));
    
    if (indexInPath >= 0) {
      // Если подкатегория уже в пути - обрезаем путь до этой позиции (убираем её и всех детей)
      setSelectedCategoryPath(prev => prev.slice(0, indexInPath));
    } else {
      // Если подкатегории нет в пути - добавляем в конец
      setSelectedCategoryPath(prev => [...prev, subcategory]);
    }
    // Возвращаем прокрутку в начало
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: 0, animated: true });
    }, 100);
  };

  // Возвращаем прокрутку в начало при изменении пути
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  }, [selectedCategoryPath]);

  // Возвращаем прокрутку товаров в начало при изменении активной категории
  useEffect(() => {
    offersScrollViewRef.current?.scrollTo({ x: 0, animated: true });
  }, [activeCategoryId]);

  if (loading && offers.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.categoryTitle}>
          {category.name}
          {offers.length > 0 && (
            <Text style={styles.productCount}> ({offers.length})</Text>
          )}
        </Text>
        <ActivityIndicator size="small" color="#FF6B00" style={styles.loader} />
      </View>
    );
  }

  // Всегда показываем категорию верхнего уровня
  return (
    <View style={styles.sectionContainer}>
      {/* Заголовок категории (название не меняется) */}
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>
          {category.name}
          {offers.length > 0 && (
            <Text style={styles.productCount}> ({offers.length})</Text>
          )}
        </Text>
      </View>

      {/* Горизонтальный список подкатегорий (весь путь + текущий уровень) */}
      {displaySubcategories.length > 0 && (
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoriesScroll}
        >
          {displaySubcategories.map(subcat => {
            // Выбранная - это любая подкатегория из пути (все в пути должны быть оранжевыми)
            const isSelected = selectedCategoryPath.some(cat => Number(cat.id) === Number(subcat.id));
            
            return (
              <TouchableOpacity
                key={subcat.id}
                style={isSelected ? [styles.subcategoryChip, styles.subcategoryChipSelected] : styles.subcategoryChip}
                onPress={() => handleSubcategoryPress(subcat)}
                activeOpacity={0.7}
              >
                <Text style={isSelected ? [styles.subcategoryText, styles.subcategoryTextSelected] : styles.subcategoryText}>
                  {subcat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Горизонтальный список товаров */}
      {offers.length > 0 && (
        <ScrollView 
          ref={offersScrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersScroll}
        >
          {offers.map(offer => (
            <View key={offer.id} style={styles.cardWrapper}>
              <MiniOfferCard 
                offer={offer} 
                onPress={() => handleProductPress(offer)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default function CatalogScreen() {
  const { 
    categories, 
    getTopLevelCategories,
    getSubCategories,
    loading: categoriesLoading, 
    refetch: refetchCategories
  } = useCategories();

  const { fetchOffersByCategory } = useOffers();

  const onRefresh = async () => {
    await refetchCategories();
  };

  if (categoriesLoading && categories.length === 0) {
    return (
      <TabScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Загрузка каталога...</Text>
        </View>
      </TabScreen>
    );
  }

  const topCategories = getTopLevelCategories();

  return (
    <TabScreen 
      onRefresh={onRefresh}
    >
      <View style={styles.content}>
        {topCategories.length > 0 ? (
          topCategories.map(cat => (
            <CategorySection 
              key={cat.id} 
              category={cat}
              getSubCategories={getSubCategories}
              fetchOffersByCategory={fetchOffersByCategory}
            />
          ))
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Категории не найдены</Text>
          </View>
        )}
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
    borderRadius: 28,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    marginBottom: 24,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    paddingTop: 4,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  productCount: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '600',
  },
  subcategoriesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
  },
  subcategoryChipSelected: {
    backgroundColor: '#FF6B00',
  },
  subcategoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  subcategoryTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  offersScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  cardWrapper: {
    width: 180,
    marginRight: 12,
  },
  loader: {
    marginVertical: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
});
