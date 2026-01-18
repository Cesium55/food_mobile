import { config } from '@/constants/config';
import { useShopPoint } from "@/hooks/useShopPoints";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from 'react-native-webview';
import ShopModal from './ShopModal';

export default function YandexMapsWebView() {
  const webViewRef = useRef<WebView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedShopPointId, setSelectedShopPointId] = useState<number | null>(null);
  
  // Получаем данные торговой точки через API
  const { shopPoint, loading } = useShopPoint(selectedShopPointId);

  const handleMarkerClick = (shopPointId: number) => {
    // Устанавливаем ID торговой точки для загрузки данных
    setSelectedShopPointId(shopPointId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedShopPointId(null);
  };

  // Преобразуем данные из API в формат для ShopModal
  const shopData = shopPoint ? {
    id: shopPoint.id,
    name: `Торговая точка #${shopPoint.id}`,
    address: shopPoint.address_formated || shopPoint.address_raw,
    latitude: shopPoint.latitude,
    longitude: shopPoint.longitude,
  } : null;

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
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {shopData && (
        <ShopModal
          visible={modalVisible}
          shop={shopData}
          onClose={handleCloseModal}
        />
      )}
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
});

