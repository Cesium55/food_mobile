import { createProductModal } from '@/components/product/ProductModalContent';
import { config } from '@/constants/config';
import { useModal } from '@/contexts/ModalContext';
import { Offer, useOffers } from '@/hooks/useOffers';
import { useShopPoint } from "@/hooks/useShopPoints";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
const ShopModalContent = React.memo(function ShopModalContent({ 
  shopPointId, 
  hasBeenLoaded,
  showSkeleton = true
}: { 
  shopPointId: number;
  hasBeenLoaded: boolean;
  showSkeleton?: boolean;
}) {
  // Проверяем, были ли данные уже загружены для этого магазина
  const savedState = shopModalStates.get(shopPointId);
  const hasDataLoaded = loadedShopPointsSet.has(shopPointId) || savedState?.hasLoadedOnce || hasBeenLoaded;
  
  // Отслеживаем, был ли запрос уже сделан для этого магазина
  const requestMadeRef = useRef(false);
  
  const { shopPoint, loading: shopPointLoading } = useShopPoint(shopPointId);
  const { getOffersByShop, loading: offersLoading, fetchOffersWithLocation } = useOffers();
  const { openModal, closeModal } = useModal();
  
  // НЕ используем useModalItem() здесь, чтобы избежать перерендера при изменении контекста
  // Вместо этого используем стабильное значение, которое не меняется после первой загрузки
  const isTopModalRef = useRef(false);
  
  // Восстанавливаем состояние из глобального хранилища или создаем новое
  const [minDelayPassed, setMinDelayPassed] = useState(savedState?.minDelayPassed ?? false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(savedState?.hasLoadedOnce ?? false);
  const startTimeRef = useRef<number>(Date.now());
  
  // isTopModal не используется в логике после первой загрузки, поэтому просто используем false
  // Это предотвращает перерендер при изменении контекста
  const isTopModal = false; // Всегда false, чтобы не вызывать перерендер
  
  const displayShopPoint = shopPoint;
  const displayLoading = shopPointLoading;
  
  // Сохраняем состояние в глобальное хранилище при изменении
  useEffect(() => {
    shopModalStates.set(shopPointId, {
      minDelayPassed,
      hasLoadedOnce,
    });
  }, [shopPointId, minDelayPassed, hasLoadedOnce]);

  const handleOfferPress = (offer: Offer) => {
    if (!offer || !offer.id) {
      console.warn('Invalid offer passed to handleOfferPress:', offer);
      return;
    }
    
    console.log('[ShopModalContent] Opening product modal for offer:', offer.id);
    
    // Создаем контент модалки товара
    const { content, footer } = createProductModal(offer);
    
    // Открываем новую модалку поверх текущей (добавляем в стек)
    openModal(content, footer);
  };
  
  // Отслеживаем минимальную задержку в 0.5 секунды только при первом открытии
  useEffect(() => {
    // Если данные уже были загружены ранее или состояние было сохранено, не показываем скелет
    if ((hasBeenLoaded || hasLoadedOnce) && displayShopPoint && !displayLoading) {
      setMinDelayPassed(true);
      setHasLoadedOnce(true);
      return;
    }
    
    // Если состояние уже было сохранено, восстанавливаем его
    if (savedState?.minDelayPassed) {
      setMinDelayPassed(true);
      return;
    }
    
    startTimeRef.current = Date.now();
    setMinDelayPassed(false);
    
    const timer = setTimeout(() => {
      setMinDelayPassed(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [shopPointId, hasBeenLoaded, hasLoadedOnce, displayShopPoint, displayLoading, savedState]);
  
  // Загружаем офферы по координатам торговой точки при открытии модалки
  // НЕ загружаем, если данные уже были загружены
  const offersLoadedForShopRef = useRef<Set<number>>(new Set());
  const lastLoadedShopPointIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Если данные уже загружены для этого магазина, не делаем запрос снова
    if (hasDataLoaded && offersLoadedForShopRef.current.has(shopPointId)) {
      return;
    }
    
    // Если запрос уже был сделан для этого магазина, не делаем его снова
    if (lastLoadedShopPointIdRef.current === shopPointId && offersLoadedForShopRef.current.has(shopPointId)) {
      return;
    }
    
    if (displayShopPoint?.latitude !== undefined && displayShopPoint?.longitude !== undefined) {
      // Загружаем офферы в небольшой области вокруг торговой точки (±0.01 градуса ≈ 1 км)
      const offset = 0.01;
      lastLoadedShopPointIdRef.current = shopPointId;
      offersLoadedForShopRef.current.add(shopPointId);
      fetchOffersWithLocation({
        minLatitude: displayShopPoint.latitude - offset,
        maxLatitude: displayShopPoint.latitude + offset,
        minLongitude: displayShopPoint.longitude - offset,
        maxLongitude: displayShopPoint.longitude + offset,
      });
    }
  }, [displayShopPoint?.id, displayShopPoint?.latitude, displayShopPoint?.longitude, fetchOffersWithLocation, hasDataLoaded, shopPointId]);
  
  // Отмечаем магазин как загруженный, когда данные успешно загружены
  useEffect(() => {
    if (shopPoint && !shopPointLoading) {
      // Используем глобальное множество для хранения загруженных магазинов
      // Это нужно, чтобы состояние сохранялось между монтированиями компонента
      loadedShopPointsSet.add(shopPointId);
      setHasLoadedOnce(true);
    }
  }, [shopPoint, shopPointLoading, shopPointId]);
  
  // Получаем офферы для данного магазина из загруженных данных
  const shopOffers = displayShopPoint ? getOffersByShop(displayShopPoint.id) : [];
  const shopName = displayShopPoint ? `Торговая точка #${displayShopPoint.id}` : '';
  const shopAddress = displayShopPoint?.address_formated || displayShopPoint?.address_raw || '';
  
  // Показываем данные только если прошло минимум 0.5 секунды И данные загружены
  // Но если данные уже были загружены хотя бы раз, не показываем скелет при возврате
  // Также не показываем скелет, если showSkeleton = false
  const isLoading = showSkeleton && !hasBeenLoaded && !hasLoadedOnce && (!minDelayPassed || displayLoading || (offersLoading && shopOffers.length === 0));

  return (
    <View style={styles.modalContent}>
      {/* Информация о магазине */}
      <View style={styles.shopInfo}>
        <View style={styles.shopIcon}>
          {(shopPointLoading && !hasDataLoaded) ? (
            <SkeletonBox style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <Text style={styles.shopIconText}>🏪</Text>
          )}
        </View>
        <View style={styles.shopDetails}>
          {(shopPointLoading && !hasDataLoaded) ? (
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
                <GridOfferList 
                  offers={shopOffers}
                  onOfferPress={handleOfferPress}
                />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Мемоизация: перерендериваем только если изменились важные пропсы
  // isTopModal не в пропсах, он приходит через контекст, поэтому не учитываем его здесь
  return (
    prevProps.shopPointId === nextProps.shopPointId &&
    prevProps.hasBeenLoaded === nextProps.hasBeenLoaded &&
    prevProps.showSkeleton === nextProps.showSkeleton
  );
});

// Глобальное хранилище для загруженных магазинов (вне компонента, чтобы сохранялось между монтированиями)
export const loadedShopPointsSet = new Set<number>();

// Глобальное хранилище для состояния модалок магазинов
interface ShopModalState {
  minDelayPassed: boolean;
  hasLoadedOnce: boolean;
}

const shopModalStates = new Map<number, ShopModalState>();

// Функция для создания модалки магазина (экспортируем для использования в других компонентах)
export function createShopModal(shopPointId: number) {
  const hasBeenLoaded = loadedShopPointsSet.has(shopPointId);
  return {
    content: <ShopModalContent 
      shopPointId={shopPointId} 
      hasBeenLoaded={hasBeenLoaded}
      showSkeleton={true}
    />,
  };
}


export default function YandexMapsWebView() {
  const webViewRef = useRef<WebView>(null);
  const [selectedShopPointId, setSelectedShopPointId] = useState<number | null>(null);
  const { openModal, closeModal, closeAllModals, isOpen } = useModal();
  const lastOpenedIdRef = useRef<number | null>(null);
  const shopModalOpenedRef = useRef<boolean>(false);

  // Открываем модалку при изменении selectedShopPointId
  // Важно: этот эффект должен срабатывать только при изменении selectedShopPointId,
  // и только если модалка магазина еще не была открыта
  useEffect(() => {
    // Открываем модалку магазина только если:
    // 1. selectedShopPointId установлен
    // 2. Модалка магазина еще не была открыта (shopModalOpenedRef.current === false)
    // 3. Это другой магазин, чем последний открытый
    // 4. Нет открытых модалок (чтобы не открывать поверх модалки товара)
    // Проверяем isOpen через ref, чтобы избежать лишних перерендеров
    if (selectedShopPointId && !shopModalOpenedRef.current && lastOpenedIdRef.current !== selectedShopPointId) {
      // Проверяем isOpen только в момент открытия, не добавляя его в зависимости
      // Это предотвратит повторное открытие при изменении isOpen
      if (!isOpen) {
        lastOpenedIdRef.current = selectedShopPointId;
        shopModalOpenedRef.current = true;
        // Проверяем, был ли этот магазин уже загружен
        const hasBeenLoaded = loadedShopPointsSet.has(selectedShopPointId);
        // Создаем контент модалки напрямую, чтобы избежать проблем с зависимостями
        // showSkeleton = true только при первом открытии, при возврате из стека будет false
        openModal(
          <ShopModalContent 
            shopPointId={selectedShopPointId} 
            hasBeenLoaded={hasBeenLoaded}
            showSkeleton={true}
          />
        );
      }
    }
    // Убираем openModal и isOpen из зависимостей, чтобы эффект срабатывал только при изменении selectedShopPointId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShopPointId]);
  

  // Сбрасываем selectedShopPointId когда все модалки закрываются
  useEffect(() => {
    if (!isOpen) {
      // Небольшая задержка перед сбросом, чтобы избежать повторного открытия
      const timer = setTimeout(() => {
        setSelectedShopPointId(null);
        lastOpenedIdRef.current = null;
        shopModalOpenedRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleMarkerClick = (shopPointId: number) => {
    // Если модалка магазина уже открыта для этого же маркера, не делаем ничего
    if (shopModalOpenedRef.current && lastOpenedIdRef.current === shopPointId) {
      return;
    }
    
    // Если модалка магазина открыта для другого маркера, закрываем все модалки перед открытием новой
    if (shopModalOpenedRef.current) {
      // Используем closeAllModals чтобы закрыть все модалки (и магазина, и товара)
      closeAllModals();
      // Небольшая задержка перед открытием новой модалки
      setTimeout(() => {
        shopModalOpenedRef.current = false;
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
