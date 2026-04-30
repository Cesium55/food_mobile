/**
 * Horizontal Offer List - Горизонтальный список товаров
 */

import { spacing } from '@/constants/tokens';
import { useLocation } from '@/hooks/useLocation';
import { Offer } from '@/hooks/useOffers';
import React from 'react';
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
  const { coords: userLocation } = useLocation();
  
  // Фильтруем просроченные
  const now = new Date();
  const validOffers = offers.filter(offer => {
    const expiresDate = new Date(offer.expiresDate);
    return expiresDate > now;
  });
  
  const displayOffers = limit ? validOffers.slice(0, limit) : validOffers;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {displayOffers.map((offer) => (
        <View key={offer.id} style={styles.cardWrapper}>
          <MiniOfferCard 
            offer={offer}
            userLocation={userLocation}
            onPress={onOfferPress ? () => onOfferPress(offer) : undefined}
            showCheaperBadge={true}
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
