import { IconSymbol } from '@/components/ui/icon-symbol';
import { Offer } from '@/hooks/useOffers';
import { getCurrentPrice } from '@/utils/pricingUtils';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProductPriceSectionProps {
  offer: Offer;
}

export default function ProductPriceSection({ offer }: ProductPriceSectionProps) {
  const currentPrice = getCurrentPrice(offer);
  const currentPriceNum = currentPrice !== null ? parseFloat(currentPrice) : null;
  const originalCostNum = parseFloat(offer.originalCost);
  const hasDiscount = currentPriceNum !== null && currentPriceNum < originalCostNum;
  
  // Проверяем, действительно ли товар просрочен
  const now = new Date();
  const expiryDate = new Date(offer.expiresDate);
  const isExpired = !isNaN(expiryDate.getTime()) && expiryDate.getTime() < now.getTime() - 60000; // Просрочен более чем на минуту

  return (
    <View style={styles.container}>
      {offer.isDynamicPricing && (
        <View style={styles.dynamicPricingBadge}>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color="#007AFF" />
          <Text style={styles.dynamicPricingText}>Динамическая цена</Text>
        </View>
      )}
      {currentPrice !== null ? (
        <>
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{offer.originalCost} ₽</Text>
            )}
            <Text style={styles.currentPrice}>{currentPrice} ₽</Text>
          </View>
          {hasDiscount && currentPriceNum !== null && (
            <Text style={styles.discountText}>
              Экономия {(originalCostNum - currentPriceNum).toFixed(2)} ₽
            </Text>
          )}
          {offer.isDynamicPricing && (
            <Text style={styles.dynamicPriceNote}>
              Цена рассчитана автоматически
            </Text>
          )}
        </>
      ) : isExpired ? (
        <View style={styles.priceRow}>
          <Text style={styles.dynamicPricePlaceholder}>
            Товар просрочен
          </Text>
        </View>
      ) : (
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>{offer.originalCost} ₽</Text>
          {offer.isDynamicPricing && (
            <Text style={styles.dynamicPriceNote}>
              Цена рассчитывается...
            </Text>
          )}
        </View>
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
  dynamicPricingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  dynamicPricingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  dynamicPriceNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dynamicPricePlaceholder: {
    fontSize: 16,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});

