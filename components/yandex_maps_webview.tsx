import { config } from '@/constants/config';
import { useModal } from '@/contexts/ModalContext';
import { useOffers } from '@/hooks/useOffers';
import { useShopPoint } from "@/hooks/useShopPoints";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { WebView } from 'react-native-webview';
import { GridOfferList } from './offers/GridOfferList';

// Компонент скелетона с анимацией
function SkeletonBox({ style }: { style?: any }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.8],
  });

  return (
    <Animated.View style={[styles.skeletonBox, style, { opacity }]} />
  );
}

// Компонент контента модалки для торговой точки
function ShopModalContent({ shopPointId }: { shopPointId: number }) {
  const { shopPoint, loading: shopPointLoading } = useShopPoint(shopPointId);
  const { getOffersByShop, loading: offersLoading, fetchOffersWithLocation } = useOffers();
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  
  // Отслеживаем минимальную задержку в 0.5 секунды
  useEffect(() => {
    startTimeRef.current = Date.now();
    setMinDelayPassed(false);
    
    const timer = setTimeout(() => {
      setMinDelayPassed(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [shopPointId]);
  
  // Загружаем офферы по координатам торговой точки при открытии модалки
  useEffect(() => {
    if (shopPoint?.latitude !== undefined && shopPoint?.longitude !== undefined) {
      // Загружаем офферы в небольшой области вокруг торговой точки (±0.01 градуса ≈ 1 км)
      const offset = 0.01;
      fetchOffersWithLocation({
        minLatitude: shopPoint.latitude - offset,
        maxLatitude: shopPoint.latitude + offset,
        minLongitude: shopPoint.longitude - offset,
        maxLongitude: shopPoint.longitude + offset,
      });
    }
  }, [shopPoint?.id, shopPoint?.latitude, shopPoint?.longitude, fetchOffersWithLocation]);
  
  // Получаем офферы для данного магазина из загруженных данных
  const shopOffers = shopPoint ? getOffersByShop(shopPoint.id) : [];
  const shopName = shopPoint ? `Торговая точка #${shopPoint.id}` : '';
  const shopAddress = shopPoint?.address_formated || shopPoint?.address_raw || '';
  
  // Показываем данные только если прошло минимум 0.5 секунды И данные загружены
  const isLoading = !minDelayPassed || shopPointLoading || (offersLoading && shopOffers.length === 0);

  return (
    <View style={styles.modalContent}>
      {/* Информация о магазине */}
      <View style={styles.shopInfo}>
        <View style={styles.shopIcon}>
          {shopPointLoading ? (
            <SkeletonBox style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <Text style={styles.shopIconText}>🏪</Text>
          )}
        </View>
        <View style={styles.shopDetails}>
          {shopPointLoading ? (
            <>
              <SkeletonBox style={{ width: '70%', height: 20, marginBottom: 8 }} />
              <SkeletonBox style={{ width: '90%', height: 16 }} />
            </>
          ) : (
            <>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.shopAddress}>📍 {shopAddress}</Text>
            </>
          )}
        </View>
      </View>

      {/* Товары со скидкой */}
      <View style={styles.offersSection}>
        {isLoading ? (
          <>
            <View style={styles.sectionTitleContainer}>
              <SkeletonBox style={{ width: '50%', height: 24 }} />
            </View>
            {/* Скелетон карточек товаров (2 колонки) */}
            <View style={styles.skeletonGrid}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <SkeletonBox style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 8 }} />
                  <SkeletonBox style={{ width: '80%', height: 14, marginBottom: 4 }} />
                  <SkeletonBox style={{ width: '60%', height: 12 }} />
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                Предложения ({shopOffers.length})
              </Text>
            </View>
            
            {shopOffers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Нет доступных предложений</Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                <GridOfferList offers={shopOffers} />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export default function YandexMapsWebView() {
  const webViewRef = useRef<WebView>(null);
  const [selectedShopPointId, setSelectedShopPointId] = useState<number | null>(null);
  const { openModal, closeModal, isOpen } = useModal();
  const lastOpenedIdRef = useRef<number | null>(null);

  // Открываем модалку при изменении selectedShopPointId
  useEffect(() => {
    if (selectedShopPointId && !isOpen && lastOpenedIdRef.current !== selectedShopPointId) {
      lastOpenedIdRef.current = selectedShopPointId;
      openModal(<ShopModalContent shopPointId={selectedShopPointId} />);
    }
  }, [selectedShopPointId, isOpen, openModal]);

  // Сбрасываем selectedShopPointId когда модалка закрывается
  useEffect(() => {
    if (!isOpen) {
      // Небольшая задержка перед сбросом, чтобы избежать повторного открытия
      const timer = setTimeout(() => {
        setSelectedShopPointId(null);
        lastOpenedIdRef.current = null;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleMarkerClick = (shopPointId: number) => {
    // Если модалка уже открыта для этого же маркера, не делаем ничего
    if (isOpen && lastOpenedIdRef.current === shopPointId) {
      return;
    }
    
    // Если модалка открыта для другого маркера, закрываем её перед открытием новой
    if (isOpen) {
      closeModal();
      // Небольшая задержка перед открытием новой модалки
      setTimeout(() => {
        setSelectedShopPointId(shopPointId);
      }, 200);
    } else {
      setSelectedShopPointId(shopPointId);
    }
  };

  // Мемоизируем source, чтобы WebView не перезагружался при каждом рендере
  const webViewSource = useMemo(() => {
    const baseUrl = config.apiBaseUrl.replace(/\/$/, '');
    return { uri: `${baseUrl}/maps/shop-points` };
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={webViewSource}
        originWhitelist={['*']}
        javaScriptEnabled
        cacheEnabled={true}
        incognito={false}
        sharedCookiesEnabled={true}
        style={styles.webview}
        geolocationEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'markerClick' && data.shopPointId) {
              handleMarkerClick(data.shopPointId);
            }
          } catch (error) {
            // Error parsing WebView message
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
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
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  offersSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingTop: 16,
    width: '100%',
  },
  sectionTitleContainer: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  gridContainer: {
    paddingHorizontal: 8,
    width: '100%',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  skeletonBox: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  skeletonCard: {
    width: '48%',
    marginBottom: 12,
  },
});
