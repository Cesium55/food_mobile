import { Offer } from '@/hooks/useOffers';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProductPriceSectionProps {
  offer: Offer;
}

export default function ProductPriceSection({ offer }: ProductPriceSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        {offer.discount > 0 && (
          <Text style={styles.originalPrice}>{offer.originalCost.toFixed(2)} ₽</Text>
        )}
        <Text style={styles.currentPrice}>{offer.currentCost.toFixed(2)} ₽</Text>
      </View>
      {offer.discount > 0 && (
        <Text style={styles.discountText}>
          Экономия {((offer.originalCost - offer.currentCost).toFixed(2))} ₽
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  originalPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

