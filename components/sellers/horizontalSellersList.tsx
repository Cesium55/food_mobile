import { useSellers } from '@/hooks/useSellers';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AVATAR_SIZE = 90;

export default function HorizontalSellersList() {
  const { sellers } = useSellers();
  const router = useRouter();
  const segments = useSegments();

  const handleSellerPress = (sellerId: number) => {
    // Определяем текущую вкладку и переходим в seller внутри неё
    const currentTab = segments[0] === '(tabs)' ? segments[1] : '(home)';
    router.push(`/(tabs)/${currentTab}/seller/${sellerId}`);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {sellers.map((seller) => (
        <View key={seller.id} style={styles.sellerItem}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            activeOpacity={0.7}
            onPress={() => handleSellerPress(seller.id)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {seller.short_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.sellerName} numberOfLines={2}>
            {seller.short_name}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    gap: AVATAR_SIZE * 0.1875,
  },
  sellerItem: {
    alignItems: 'center',
    width: AVATAR_SIZE * 1.25,
  },
  avatarContainer: {
    marginBottom: AVATAR_SIZE * 0.125,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: AVATAR_SIZE * 0.0625,
    elevation: 3,
  },
  avatarText: {
    fontSize: AVATAR_SIZE * 0.375,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sellerName: {
    fontSize: AVATAR_SIZE * 0.1875,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
});

