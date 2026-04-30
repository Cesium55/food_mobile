/**
 * Grid Offer List - Сетка товаров 2 колонки
 */

import { spacing } from '@/constants/tokens';
import { useLocation } from '@/hooks/useLocation';
import { Offer } from '@/hooks/useOffers';
import React from 'react';
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
  const { coords: userLocation } = useLocation();
  
  // Фильтруем просроченные
  const now = new Date();
  const validOffers = offers.filter(offer => {
    const expiresDate = new Date(offer.expiresDate);
    return expiresDate > now;
  });
  
  const displayOffers = limit ? validOffers.slice(0, limit) : validOffers;

  return (
    <View style={styles.grid}>
      {displayOffers.map((offer, index) => (
        <View 
          key={offer.id} 
          style={[
            styles.gridItem,
            index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight
          ]}
        >
          <MiniOfferCard 
            offer={offer}
            userLocation={userLocation}
            onPress={onOfferPress ? () => onOfferPress(offer) : undefined}
            showCheaperBadge={true}
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
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: spacing.md,
  },
  gridItemLeft: {
    marginRight: 0,
  },
  gridItemRight: {
    marginLeft: 0,
  },
});
