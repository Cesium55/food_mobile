import { StyleSheet, Text, View } from 'react-native';

import { GridOfferList } from '@/components/offers/GridOfferList';
import Search from '@/components/search/search';
import HorizontalSellersList from '@/components/sellers/horizontalSellersList';
import { TabScreen } from '@/components/TabScreen';
import { spacing, typography } from '@/constants/tokens';
import { useColors } from '@/contexts/ThemeContext';
import { useOffers } from '@/hooks/useOffers';
import { getCurrentLocation, getLocationWithCache } from '@/services/locationService';
import { getBoundingBox } from '@/utils/locationUtils';
import { useCallback, useEffect, useState } from 'react';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { offers, fetchOffersWithLocation, fetchOffers, loading } = useOffers();
  const colors = useColors();
  const styles = createStyles(colors);

  // Функция загрузки данных
  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    console.log('🔄 Загрузка данных для главной страницы...');
    
    let location = null;
    
    if (forceRefresh) {
      // При принудительном обновлении пытаемся получить свежее местоположение
      console.log('🔄 Обновление: запрашиваем свежее местоположение...');
      location = await getCurrentLocation(3000);
      
      if (!location) {
        // Если не получили свежее, берем из кэша
        console.log('⚠️ Не удалось получить свежее местоположение, используем кэш');
        const cached = await getLocationWithCache();
        location = cached.location;
      } else {
        console.log('✅ Получено свежее местоположение');
      }
    } else {
      // При обычной загрузке используем кэш
      const { location: cachedLocation, isFromCache } = await getLocationWithCache();
      location = cachedLocation;
      console.log(`📍 Местоположение ${isFromCache ? 'из кэша' : 'получено'}`);
    }
    
    // Загружаем данные с учетом местоположения (если есть)
    if (location) {
      const boundingBox = getBoundingBox(location.latitude, location.longitude, 1000);
      await fetchOffersWithLocation(boundingBox);
    } else {
      console.log('📍 Местоположение недоступно, загружаем все офферы');
      await fetchOffers();
    }
  }, [fetchOffersWithLocation, fetchOffers]);

  // Начальная загрузка при монтировании
  useEffect(() => {
    let isMounted = true;
    
    const initialLoad = async () => {
      if (isMounted) {
        await loadData(false);
      }
    };

    initialLoad();
    
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // Обработчик pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData(true); // При рефреше запрашиваем свежие данные
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return (
    <TabScreen 
      title="Home"
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <View style={styles.searchContainer}>
        <Search
          placeholder="Поиск..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.blockContainer}>
        <Text style={styles.blockTitle}>Популярные продавцы</Text>
        <HorizontalSellersList />
      </View>

      <View style={styles.blockContainer}>
        <Text style={styles.blockTitle}>Рекомендуемые продукты</Text>
        {loading && offers.length === 0 ? (
          <Text style={styles.loadingText}>Загрузка...</Text>
        ) : offers.length === 0 ? (
          <Text style={styles.emptyText}>Нет доступных предложений</Text>
        ) : (
          <GridOfferList
            offers={offers}
            limit={10}
          />
        )}
      </View>
    </TabScreen>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  searchContainer: {
    width: '80%',
    alignSelf: 'center',
  },
  blockContainer: {
    // alignSelf: 'center',
  },
  blockTitle: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'left',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    color: colors.text.primary,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    color: colors.text.secondary,
    marginVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    color: colors.text.tertiary,
    marginVertical: spacing.xl,
  },
});
