import { IconSymbol } from "@/components/ui/icon-symbol";
import ShopInfoCard from "@/components/shop/ShopInfoCard";
import ShopOffersList from "@/components/shop/ShopOffersList";
import ShopStatsCard from "@/components/shop/ShopStatsCard";
import { useOffers } from "@/hooks/useOffers";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { useShopPoint } from "@/hooks/useShopPoints";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from 'expo-linking';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOffersByShop } = useOffers();

  const shopId = Number(id);
  const { shopPoint, loading, error } = useShopPoint(shopId);
  const shopOffers = getOffersByShop(shopId);
  const { seller } = usePublicSeller(shopPoint?.seller_id || null);

  // Функция для открытия карт с координатами магазина (показывает точку, а не маршрут)
  const openMaps = async (latitude: number, longitude: number, address?: string) => {
    try {
      if (Platform.OS === 'ios') {
        // Для iOS пробуем открыть Apple Maps (показываем точку)
        const appleMapsUrl = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${latitude},${longitude}`;
        const canOpen = await Linking.canOpenURL(appleMapsUrl);
        
        if (canOpen) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
        
        // Если Apple Maps недоступен, используем Google Maps (показываем точку)
        const googleMapsUrl = `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=15`;
        const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpenGoogle) {
          await Linking.openURL(googleMapsUrl);
          return;
        }
        
        // Если приложения нет, открываем в браузере (показываем точку)
        const query = address ? encodeURIComponent(address) : `${latitude},${longitude}`;
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
      } else {
        // Для Android пробуем открыть Google Maps (показываем точку)
        const googleMapsUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
        const canOpen = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpen) {
          await Linking.openURL(googleMapsUrl);
          return;
        }
        
        // Альтернативный вариант для Google Maps на Android
        const googleMapsUrl2 = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        const canOpen2 = await Linking.canOpenURL(googleMapsUrl2);
        
        if (canOpen2) {
          await Linking.openURL(googleMapsUrl2);
          return;
        }
        
        // Если приложения нет, пробуем Yandex Maps (показываем точку)
        const yandexMapsUrl = `yandexmaps://maps.yandex.ru/?pt=${longitude},${latitude}&z=15`;
        const canOpenYandex = await Linking.canOpenURL(yandexMapsUrl);
        
        if (canOpenYandex) {
          await Linking.openURL(yandexMapsUrl);
          return;
        }
        
        // Если приложения нет, открываем в браузере (показываем точку)
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
      }
    } catch (error) {
      console.error('Ошибка открытия карт:', error);
      Alert.alert('Ошибка', 'Не удалось открыть карты. Попробуйте еще раз.');
    }
  };

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
        <ShopInfoCard shopPoint={shopPoint} seller={seller} />

        {/* Статистика */}
        <ShopStatsCard offersCount={shopOffers.length} />

        {/* Карта */}
        {shopPoint.latitude && shopPoint.longitude && (
          <TouchableOpacity 
            style={styles.mapCard} 
            activeOpacity={0.7}
            onPress={() => openMaps(
              shopPoint.latitude!, 
              shopPoint.longitude!, 
              shopPoint.address_formated || shopPoint.address_raw
            )}
          >
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapIcon}>🗺️</Text>
              <Text style={styles.mapText}>Открыть в картах</Text>
              <Text style={styles.mapSubtext}>Показать на карте</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Товары со скидкой */}
        <ShopOffersList offers={shopOffers} />

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
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#666',
  },
  bottomSpacer: {
    height: 20,
  },
});

