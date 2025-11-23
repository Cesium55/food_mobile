import HorizontalOfferBlock from '@/components/offers/horizontalOfferBlock';
import { Offer } from '@/hooks/useOffers';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ShopOffersListProps {
  offers: Offer[];
}

export default function ShopOffersList({ offers }: ShopOffersListProps) {
  if (offers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>
          Товары со скидкой (0)
        </Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>
            В этом магазине пока нет товаров со скидкой
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Товары со скидкой ({offers.length})
      </Text>
      <View style={styles.offersList}>
        {offers.map((offer) => (
          <HorizontalOfferBlock key={offer.id} offer={offer} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  offersList: {
    gap: 12,
  },
});

