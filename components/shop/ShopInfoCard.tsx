import { PublicSeller } from '@/hooks/usePublicSeller';
import { ShopPoint } from '@/hooks/useShopPoints';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ShopInfoCardProps {
  shopPoint: ShopPoint;
  seller: PublicSeller | null;
}

export default function ShopInfoCard({ shopPoint, seller }: ShopInfoCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.shopIcon}>
        <Text style={styles.shopIconText}>🏪</Text>
      </View>
      <View style={styles.shopDetails}>
        {seller && (
          <Text style={styles.sellerName}>{seller.short_name}</Text>
        )}
        <Text style={styles.shopAddress}>📍 {shopPoint.address_formated || shopPoint.address_raw}</Text>
        {shopPoint.city && (
          <Text style={styles.shopCity}>🏙️ {shopPoint.city}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  shopIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopIconText: {
    fontSize: 40,
  },
  shopDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 6,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shopCity: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
});

