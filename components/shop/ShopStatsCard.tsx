import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ShopStatsCardProps {
  offersCount: number;
}

export default function ShopStatsCard({ offersCount }: ShopStatsCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{offersCount}</Text>
        <Text style={styles.statLabel}>товаров со скидкой</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});

