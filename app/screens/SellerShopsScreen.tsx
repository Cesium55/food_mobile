import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOffers } from "@/hooks/useOffers";
import { useSellerWithShops } from "@/hooks/usePublicSeller";
import { getFirstImageUrl } from "@/utils/imageUtils";
import { useLocalSearchParams, useRouter, useSegments } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SellerShopsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const segments = useSegments();
  const sellerId = Number(id);
  const { seller, loading: sellerLoading, error: sellerError } = useSellerWithShops(sellerId);
  const { getOffersBySeller } = useOffers();
  const [imageError, setImageError] = useState(false);

  const sellerOffers = getOffersBySeller(sellerId);
  const shops = seller?.shop_points || [];
  
  // Получаем URL первого изображения продавца
  const imageUrl = seller ? getFirstImageUrl(seller.images) : null;
  const hasImage = imageUrl && !imageError;

  if (sellerLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Загрузка...</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⏳</Text>
          <Text style={styles.errorText}>Загрузка данных продавца...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sellerError || !seller) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Продавец не найден</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🔍</Text>
          <Text style={styles.errorText}>{sellerError || 'Продавец не найден'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShopPress = (shopId: number) => {
    // Переход на список товаров магазина
    const currentTab = segments[0] === '(tabs)' ? segments[1] : '(home)';
    router.push(`/(tabs)/${currentTab}/shop/${shopId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {seller.short_name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container}>
        {/* Информация о продавце */}
        <View style={styles.sellerInfo}>
          {hasImage ? (
            <Image
              source={{ uri: imageUrl! }}
              style={styles.sellerAvatarImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {seller.short_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.sellerDetails}>
            <Text style={styles.sellerName}>{seller.full_name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{shops.length}</Text>
                <Text style={styles.statLabel}>магазинов</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{sellerOffers.length}</Text>
                <Text style={styles.statLabel}>товаров</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Список магазинов */}
        <View style={styles.shopsSection}>
          <Text style={styles.sectionTitle}>Магазины</Text>
          
          {shops.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>У этого продавца пока нет магазинов</Text>
            </View>
          ) : (
            shops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={styles.shopCard}
                activeOpacity={0.7}
                onPress={() => handleShopPress(shop.id)}
              >
                <View style={styles.shopIcon}>
                  <Text style={styles.shopIconText}>🏪</Text>
                </View>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>Магазин №{shop.id}</Text>
                  <Text style={styles.shopAddress}>{shop.address_formated || shop.address_raw}</Text>
                </View>
                <IconSymbol name="chevron.right" color="#999" size={20} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sellerInfo: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sellerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sellerAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  sellerAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sellerInn: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  shopsSection: {
    padding: 16,
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
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopIconText: {
    fontSize: 24,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  shopPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  shopHours: {
    fontSize: 14,
    color: '#4CAF50',
  },
});

