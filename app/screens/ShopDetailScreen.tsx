import HorizontalOfferBlock from "@/components/offers/horizontalOfferBlock";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOffers } from "@/hooks/useOffers";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { useShopPoint } from "@/hooks/useShopPoints";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOffersByShop } = useOffers();

  const shopId = Number(id);
  const { shopPoint, loading, error } = useShopPoint(shopId);
  const shopOffers = getOffersByShop(shopId);
  const { seller } = usePublicSeller(shopPoint?.seller_id || null);

  if (loading) {
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
          <Text style={styles.errorText}>Загрузка данных магазина...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shopPoint) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ошибка</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🔍</Text>
          <Text style={styles.errorText}>{error || 'Магазин не найден'}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          Торговая точка #{shopPoint.id}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container}>
        {/* Информация о магазине */}
        <View style={styles.shopInfo}>
          <View style={styles.shopIcon}>
            <Text style={styles.shopIconText}>🏪</Text>
          </View>
          <View style={styles.shopDetails}>
            {seller && (
              <Text style={styles.sellerName}>📦 {seller.short_name}</Text>
            )}
            <Text style={styles.shopAddress}>📍 {shopPoint.address_formated || shopPoint.address_raw}</Text>
            {shopPoint.city && (
              <Text style={styles.shopCity}>🏙️ {shopPoint.city}</Text>
            )}
          </View>
        </View>

        {/* Статистика */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{shopOffers.length}</Text>
            <Text style={styles.statLabel}>товаров со скидкой</Text>
          </View>
        </View>

        {/* Карта (заглушка) */}
        <TouchableOpacity style={styles.mapCard} activeOpacity={0.7}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapText}>Показать на карте</Text>
          </View>
        </TouchableOpacity>

        {/* Товары со скидкой */}
        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>
            Товары со скидкой ({shopOffers.length})
          </Text>
          
          {shopOffers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>
                В этом магазине пока нет товаров со скидкой
              </Text>
            </View>
          ) : (
            <View style={styles.offersList}>
              {shopOffers.map((offer) => (
                <HorizontalOfferBlock key={offer.id} offer={offer} />
              ))}
            </View>
          )}
        </View>

        {/* Отступ снизу */}
        <View style={styles.bottomSpacer} />
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
  shopInfo: {
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
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
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
  statsCard: {
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
  mapCard: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  offersSection: {
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
  bottomSpacer: {
    height: 20,
  },
});

