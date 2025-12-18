/**
 * Horizontal Offer List - Горизонтальный список товаров
 */

import { spacing } from '@/constants/tokens';
import { useLocation } from '@/hooks/useLocation';
import { Offer } from '@/hooks/useOffers';
import { useShops } from '@/hooks/useShops';
import { calculateDistance } from '@/utils/locationUtils';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MiniOfferCard } from './mini/MiniOfferCard';

interface HorizontalOfferListProps {
  offers: Offer[];
  onOfferPress?: (offer: Offer) => void;
  limit?: number;
}

export function HorizontalOfferList({ 
  offers,
  onOfferPress, 
  limit 
}: HorizontalOfferListProps) {
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
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {offersWithDistance.map(({ offer, distance }) => (
        <View key={offer.id} style={styles.cardWrapper}>
          <MiniOfferCard 
            offer={offer}
            distance={distance}
            onPress={onOfferPress ? () => onOfferPress(offer) : undefined}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    width: 160,
    marginRight: spacing.md,
  },
});
