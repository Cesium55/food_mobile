import { StyleSheet, Text, View } from 'react-native';

import { GridOfferList } from '@/components/offers/GridOfferList';
import { createProductModal } from '@/components/product/ProductModalContent';
import HorizontalSellersList from '@/components/sellers/horizontalSellersList';
import { TabScreen } from '@/components/TabScreen';
import { spacing, typography } from '@/constants/tokens';
import { useModal } from '@/contexts/ModalContext';
import { useColors } from '@/contexts/ThemeContext';
import { Offer } from '@/hooks/useOffers';
import { useOffers } from '@/hooks/useOffers';
import { getCurrentLocation, getLocationWithCache } from '@/services/locationService';
import { getBoundingBox } from '@/utils/locationUtils';
import { useCallback, useEffect, useState } from 'react';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { offers, fetchOffersWithLocation, fetchOffers, loading } = useOffers();
  const { openModal } = useModal();
  const colors = useColors();
  const styles = createStyles(colors);

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    let location = null;

    if (forceRefresh) {
      location = await getCurrentLocation(3000);

      if (!location) {
        const cached = await getLocationWithCache();
        location = cached.location;
      }
    } else {
      const { location: cachedLocation } = await getLocationWithCache();
      location = cachedLocation;
    }

    if (location) {
      const boundingBox = getBoundingBox(location.latitude, location.longitude, 1000);
      await fetchOffersWithLocation(boundingBox);
    } else {
      await fetchOffers();
    }
  }, [fetchOffersWithLocation, fetchOffers]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleOfferPress = useCallback((offer: Offer) => {
    const { content, footer } = createProductModal(offer);
    openModal(content, footer);
  }, [openModal]);

  return (
    <TabScreen
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
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
            onOfferPress={handleOfferPress}
          />
        )}
      </View>
    </TabScreen>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  blockContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  blockTitle: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'left',
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
