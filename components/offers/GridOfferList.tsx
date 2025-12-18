/**
 * Grid Offer List - Сетка товаров 2 колонки
 */

import { spacing } from '@/constants/tokens';
import { useLocation } from '@/hooks/useLocation';
import { Offer } from '@/hooks/useOffers';
import { useShops } from '@/hooks/useShops';
import { calculateDistance } from '@/utils/locationUtils';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MiniOfferCard } from './mini/MiniOfferCard';

interface GridOfferListProps {
  offers: Offer[];
  onOfferPress?: (offer: Offer) => void;
  limit?: number;
}

export function GridOfferList({ 
  offers,
  onOfferPress, 
  limit 
}: GridOfferListProps) {
  const { shops } = useShops();
  const { coords: userLocation } = useLocation();
  
  // Фильтруем просроченные
  const now = new Date();
  const validOffers = offers.filter(offer => {
    const expiresDate = new Date(offer.expiresDate);
    return expiresDate > now;
  });
  
  const displayOffers = limit ? validOffers.slice(0, limit) : validOffers;

  // Вычисляем расстояние для каждого оффера
  const offersWithDistance = useMemo(() => {
    return displayOffers.map(offer => {
      if (!userLocation) {
        return { offer, distance: undefined };
      }
      
      const shop = shops.find(s => s.id === offer.shopId);
      if (!shop?.latitude || !shop?.longitude) {
        return { offer, distance: undefined };
      }
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        shop.latitude,
        shop.longitude
      );
      
      return { offer, distance };
    });
  }, [displayOffers, userLocation, shops]);

  return (
    <View style={styles.grid}>
      {offersWithDistance.map(({ offer, distance }) => (
        <View key={offer.id} style={styles.gridItem}>
          <MiniOfferCard 
            offer={offer}
            distance={distance}
            onPress={onOfferPress ? () => onOfferPress(offer) : undefined}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  gridItem: {
    width: `calc(50% - ${spacing.md / 2}px)`,
    // Для React Native нужно вычислить ширину
    flex: 0,
    flexBasis: '48%',
  },
});
